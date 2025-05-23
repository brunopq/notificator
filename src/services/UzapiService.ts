import axios, { isAxiosError } from "axios"
import { z } from "zod"

import { env } from "@/common/utils/envConfig"

import type { IWhatsappService, WhatsappResponse } from "./IWhatsappService"

const UzApiVerifyNumberResponseSchema = z.object({
  profile: z.object({
    numberExists: z.boolean(),
  }),
})

export class UzApiService implements IWhatsappService {
  private httpClient = axios.create({
    baseURL: env.WHATSAPP_SERVICE_URL,
    headers: { sessionKey: env.WHATSAPP_INSTANCE_TOKEN },
  })

  private formatNumber(phoneNumber: string) {
    const p = phoneNumber.replace(/\D/g, "").slice(-9)

    if (p.length < 8) {
      return null
    }

    return `5551${p}`
  }

  async isOnWhatsapp(phoneNumber: string) {
    console.log(`Searching for number${phoneNumber}`)
    try {
      const res = await this.httpClient.post("/verifyNumber", {
        session: env.WHATSAPP_INSTANCE_ID,
        number: this.formatNumber(phoneNumber),
      })

      const parsed = UzApiVerifyNumberResponseSchema.safeParse(res.data)

      if (!parsed.success) {
        console.log("Could not parse response verify phone response")
        return { exists: false as false }
      }

      if (!parsed.data.profile.numberExists) {
        console.log(`Number ${phoneNumber} does not appear to be on whatsapp`)
        return { exists: false as false }
      }

      return {
        exists: true as true,
      }
    } catch (e) {
      console.log("error while validating number")
      if (isAxiosError(e)) {
        if (e.response?.status === 400) {
          console.log("not on whatsapp")
          return { exists: false as false }
        }
      }

      throw new Error("This will be unknown error")
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
        number: this.formatNumber(phoneNumber),
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
