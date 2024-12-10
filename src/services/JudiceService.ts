import { stringify } from "node:querystring"
import { TZDate } from "@date-fns/tz"
import axios, { type AxiosInstance } from "axios"
import { wrapper } from "axios-cookiejar-support"
import * as cheerio from "cheerio"
import { parse } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import { CookieJar } from "tough-cookie"
import { z } from "zod"

import { env } from "@/common/utils/envConfig"

async function createClient() {
  console.log("Establishing connection to Judice API")
  const jar = new CookieJar()
  const client = wrapper(axios.create({ jar }))

  await client.get("https://managerapia.officeadv.com.br/csrf-token")

  const xsrfTokenCookie = (
    await jar.getCookies("https://managerapia.officeadv.com.br")
  ).find((cookie) => cookie.key === "XSRF-TOKEN")

  if (!xsrfTokenCookie) {
    throw new Error("XSRF cookie not found in axios instance")
  }
  // biome-ignore lint/style/useTemplate: this is cleaner
  const xsrfToken = xsrfTokenCookie.value.replace("%3D", "") + "="

  client.defaults.headers.common["X-XSRF-TOKEN"] = xsrfToken

  await client.post("https://managerapia.officeadv.com.br/login", {
    user: env.JUDICE_USER,
    password: env.JUDICE_PASS,
    tenant: env.JUDICE_TENANT,
  })

  const acessoResponse = await client.get(
    "https://managerapia.officeadv.com.br/office/login/gerar-acesso",
  )

  // make request for the php session token
  await client.get(acessoResponse.data.retorno.url)

  console.log("Connected to Judice API")
  return client
}

const processSchema = z.object({
  f_id: z.coerce.number(),
  f_number: z.string(),
  f_cnj_number: z.string(),
  f_client: z.number(), // client judice id
  f_situation: z.number(),
  f_actiontype: z.string(),
  client_name: z.string(),
  area_name: z.string(),
  parte_adversa: z.string(),
  f_relevant: z.number(),
})

const lawsuitSearchSchema = z.object({
  messageError: z.string(),
  success: z.boolean(),
  recordsTotal: z.number(),
  recordsFiltered: z.number(),
  data: z.array(processSchema),
})

const publicationSchema = z.object({
  "0": z.string(), // chekcbox
  "1": z.string(), // date
  "2": z.string(), // cnj processo
  "3": z.string(), // iboti
  "4": z.string(), // user
  "5": z.string(), // button
})

type RawPublication = z.infer<typeof publicationSchema>

const publicationsSearchSchema = z.object({
  recordsTotal: z.number(),
  recordsFiltered: z.number(),
  data: z.array(publicationSchema),
})

type JudicePublication = {
  judiceId: number
  expeditionDate: Date
  lawsuitCNJ: string
  // lawsuitJudiceId: number
}

function formatPublication(rawPublication: RawPublication): JudicePublication {
  const judiceId = rawPublication[0].replace(/.*value="/, "").replace(/">/, "")

  return {
    judiceId: Number(judiceId),
    expeditionDate: parse(rawPublication[1], "dd/MM/yyyy", new Date()),
    lawsuitCNJ: rawPublication[2],
  }
}

const singlePublicationSchema = z.object({
  f_id: z.coerce.number(),
  f_publisher_date: z.string(),
  f_publisher: z.string(),
  f_number: z.string(),
  f_lawyername: z.string().nullable(),
  f_clietname: z.string(),
  f_vara: z.string(),
  f_orgao: z.string(),
  f_process_all: z.string(),
  f_cod_int: z.string(), // fornecedor
  f_inserted: z.string(),
  f_description: z.string(),
  f_process: z.number(), // judice lawsuit id
})

const completeArrayAppPublicationSchema = z.array(
  z.object({
    f_id: z.coerce.number(),
    f_name: z.string(),
  }),
)

const publicationSearchSchema = z.object({
  info: z.array(singlePublicationSchema),
  completeArrayAppPublication: completeArrayAppPublicationSchema,
})

const lawsuitInfoSchema = z.object({
  processo: z.string(),
  cnj: z.string(),
  fase: z.string(),
  área: z.string(),
  "tipo de ação": z.string(),
  cidade: z.string(),
  partes: z.string(),
})

const clientSearchSchema = z.object({
  info: z.string(),
})

const clientInfoSchema = z.object({
  nome: z.string().min(1),
  id: z.coerce.number(),
  cpf: z.string().optional(),
  nascimento: z.string().optional(),
  "estado civil": z.string().optional(),
  "e-mail": z.string().optional(),
  celular: z.string().optional(),
})

class JudiceService {
  httpClient: AxiosInstance

  constructor(client: AxiosInstance) {
    this.httpClient = client
  }

  private async extractAudiencias(data: string) {
    const $ = cheerio.load(data)

    const res = $("div.process-list li:even")

    const arr = res
      .map((i, el) =>
        $(el).extract({
          date: {
            selector: "div.calendar",
            value: (el) =>
              parse(
                $(el).text(),
                "ddMMM/yyyyHH:mm",
                TZDate.tz("America/Sao_Paulo"),
                { locale: ptBR },
              ),
          },
          details: "div.details",
          type: {
            selector: "div.details > strong",
            value: (el) => {
              const normalized = $(el)
                .text()
                .normalize("NFKD")
                // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()

              if (normalized.includes("audiencia")) {
                return "audiencia" as const
              }
              if (normalized.includes("pericia")) {
                return "pericia" as const
              }
            },
          },
          lastModification: {
            selector: "div.details",
            value: (el) => {
              const dateTimeMatches = $(el)
                .text()
                .match(/Modificado .* em (\d\d\/\d\d\/\d\d\d\d \d\d:\d\d:\d\d)/)
              const dateTime = dateTimeMatches?.[1]
              if (!dateTime) return undefined

              return parse(dateTime, "dd/MM/yyyy HH:mm:ss", new Date())
            },
          },
          judiceId: {
            selector: "div.details",
            value: (el) => {
              const idMatches = $(el)
                .text()
                .match(/\(ID: (\d*)\)/)
              const id = idMatches?.[1]
              if (!id || Number.isNaN(Number(id))) return undefined

              return Number(id)
            },
          },
        }),
      )
      .toArray()
      .filter((a) => a.date && a.lastModification && a.type)

    return arr
  }

  private async extractLawsuitInfo(data: string) {
    const $ = cheerio.load(data)

    const client = $("h2.block > a").attr("href")
    const clientId = Number(client?.match(/\d+$/)?.[0])

    const result = {} as Record<string, string>

    $("div.well")
      .find("b")
      .each((_, element) => {
        const key = $(element)
          .text()
          .replaceAll(/[:-]/g, "")
          .trim()
          .toLowerCase()

        const sibling = $(element).get(0)?.nextSibling
        if (!sibling) return

        let value = $(sibling).text().trim()
        value = value.split("-").at(0)?.trim() || value

        if (key) {
          result[key] = value
        }
      })

    const { cnj, partes } = lawsuitInfoSchema.parse(result)

    return {
      adverseParty: partes,
      clientId,
      cnj,
    }
  }

  async getAudienciasByJudiceId(id: number) {
    const { data } = await this.httpClient.get(
      `https://legala.officeadv.com.br/pgj/execution-hearings/${id}`,
    )

    return await this.extractAudiencias(data)
  }

  async searchLawsuitByCNJ(cnj: string) {
    const searchResponse = await this.httpClient.post(
      "https://legala.officeadv.com.br/pgj/search/methodAjaxGetSearchProcess",
      stringify({
        start: "0",
        length: "25",
        "txtInputSearchTerm[]": cnj,
        "cboType[]": 1,
      }),
    )

    const parsedResponse = lawsuitSearchSchema.parse(searchResponse.data)

    if (parsedResponse.data.length === 0) {
      return null
    }

    return parsedResponse.data[0]
  }

  async lawsuitWithMovimentationsByJudiceId(judiceId: number) {
    const { data } = await this.httpClient.get(
      `https://legala.officeadv.com.br/pgj/execution-hearings/${judiceId}`,
    )

    const movimentations = await this.extractAudiencias(data)
    const lawsuitInfo = await this.extractLawsuitInfo(data)

    return {
      ...lawsuitInfo,
      judiceId,
      movimentations,
    }
  }

  async getAudienciasByCNJ(cnj: string) {
    const lawsuit = await this.searchLawsuitByCNJ(cnj)

    if (!lawsuit) {
      return []
    }

    return await this.getAudienciasByJudiceId(lawsuit.f_id)
  }

  async getPublications() {
    const res = await this.httpClient.post(
      "https://legala.officeadv.com.br/pgj/publication/methodAjaxListPublications",
      stringify({
        start: 0,
        length: 9999,
        tab: "process",
        // txtDataInicial: "05/11/2024",
        // txtDataFinal: "05/11/2024",
        cboLawyer: 0,
        cboClient: "",
        cboWarning: 0,
        cboRead: 0,
      }),
    )

    const parsed = publicationsSearchSchema.parse(res.data)

    return parsed.data.map(formatPublication)
  }

  async getPublicationByJudiceId(id: number) {
    const res = await this.httpClient.post(
      "https://legala.officeadv.com.br/pgj/publication/methodAjaxGetDescription",
      stringify({
        id,
      }),
    )

    const parsed = publicationSearchSchema.parse(res.data)

    return parsed
  }

  async getClientByJudiceId(id: number) {
    const res = await this.httpClient.post(
      "https://legala.officeadv.com.br/pgj/clients/ajax-get-clients-infobar",
      stringify({ clientId: id }),
    )

    const parsed = clientSearchSchema.parse(res.data)

    const $ = cheerio.load(parsed.info)

    const { lines } = $.extract({
      lines: [{ selector: ".client-bar-parent > div" }],
    })

    const info = lines
      .flatMap((s) => [...s.matchAll(extractKeyValuesRegex)])
      .reduce(
        (acc, m) => {
          acc[m[1].trim().toLocaleLowerCase()] = String(m[2].trim())
          return acc
        },
        {} as Record<string, unknown>,
      )

    const parsedInfo = clientInfoSchema.parse(info)

    return parsedInfo
  }
}

const extractKeyValuesRegex = /([A-Za-z\s-]+):\s*([^:]+?)(?=\s+[A-Za-z\s]+:|$)/g

export default new JudiceService(await createClient())
