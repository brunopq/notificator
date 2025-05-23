import { readFileSync } from "node:fs"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale/pt-BR"
import handlebars, { type TemplateDelegate } from "handlebars"
import { z } from "zod"

import reportTemplatePath from "@/templates/email/reportTemplate.hbs"

import {
  type NotificationError,
  notificationErrorsSchema,
} from "./NotificationService"

const reportTemplateParams = z.object({
  reportDate: z.date(),
  generatedDatetime: z.date(),
  processedMovimentationCount: z.number(),
  totalClients: z.number(),
  notificationsSent: z.number(),
  notificationsNotSent: z.number(),
  clients: z.array(
    z.object({
      name: z.string(),
      phoneNumber: z.string(),
      movimentations: z.array(
        z.object({
          lawsuitCNJ: z.string(),
          type: z.string(),
          date: z.date(),
          notificationSent: z.boolean(),
          notificationError: notificationErrorsSchema.optional(),
        }),
      ),
    }),
  ),
})
export type ReportTemplateParams = z.infer<typeof reportTemplateParams>

const notificationErrorMessages: Record<NotificationError, string> = {
  NO_PHONE_NUMBER: "Sem número de telefone",
  INVALID_PHONE: "Número inválido",
  PHONE_NOT_ON_WHATSAPP: "WhatsApp não encontrado",
  UNKNOWN_ERROR: "Erro desconhecido",
}

handlebars.registerHelper(
  "notificationErrorMessage",
  (errorCode: NotificationError | undefined) =>
    errorCode === undefined ? "-" : notificationErrorMessages[errorCode],
)
handlebars.registerHelper("formatDateTime", (date: Date) =>
  format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
)
handlebars.registerHelper("formatDate", (date: Date) =>
  format(date, "dd/MM/yyyy", { locale: ptBR }),
)

export class TemplateService {
  private reportTemplate: TemplateDelegate<ReportTemplateParams>

  constructor() {
    const rawReportTemplate = readFileSync(reportTemplatePath, "utf-8")
    this.reportTemplate =
      handlebars.compile<ReportTemplateParams>(rawReportTemplate)
  }

  renderReport(params: ReportTemplateParams) {
    return this.reportTemplate(params)
  }
}
