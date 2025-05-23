import axios, { isAxiosError } from "axios"
import { z } from "zod"

import { env } from "@/common/utils/envConfig"

import type { IWhatsappService, WhatsappResponse } from "./IWhatsappService"

const UzApiVerifyNumberResponseSchema = z.object({
  numberExists: z.boolean(),
})

export class UzApiService implements IWhatsappService {
  private httpClient = axios.create({
    baseURL: env.WHATSAPP_SERVICE_URL,
    headers: { sessionKey: env.WHATSAPP_INSTANCE_TOKEN },
  })

  async isOnWhatsapp(phoneNumber: string) {
    console.log(`Searching for number${phoneNumber}`)
    const res = await this.httpClient.post("/verifyNumber", {
      session: env.WHATSAPP_INSTANCE_ID,
      number: phoneNumber,
    })

    const parsed = UzApiVerifyNumberResponseSchema.safeParse(res.data)

    if (!parsed.success) {
      console.log("Could not parse response verify phone response")
      return { exists: false as false }
    }

    if (!parsed.data.numberExists) {
      console.log(`Number ${phoneNumber} does not appear to be on whatsapp`)
      return { exists: false as false }
    }

    return {
      exists: true as true,
    }
  }

  async sendMessage(
    phoneNumber: string,
    message: string,
  ): Promise<WhatsappResponse> {
    try {
      const { exists } = await this.isOnWhatsapp(phoneNumber)

      if (!exists) {
        console.log(`Number ${phoneNumber} is not on WhatsApp`)
        return { error: "not_on_whatsapp" as const }
      }

      const response = await this.httpClient.post("/sendText", {
        session: env.WHATSAPP_INSTANCE_ID,
        number: phoneNumber,
        text: message,
      })

      return { data: response.data }
    } catch (e) {
      console.error("Error while sending message via UZAPI")
      console.log(e)

      return { error: "unknown" }
    }
  }
}
