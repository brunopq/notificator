import axios from "axios"
import { wrapper } from "axios-cookiejar-support"
import { CookieJar } from "tough-cookie"

import { env } from "@/common/utils/envConfig"

// This file is used to create an axios client that can be used to make requests to the Judice API.
// It handles the authentication and sets the necessary headers for the requests.
export async function createJudiceApiClient() {
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
