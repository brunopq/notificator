import axios, { isAxiosError } from "axios"
import { z } from "zod"

import { env } from "@/common/utils/envConfig"

const BASE_URL = `https://graph.facebook.com/v22.0/${env.WHATSAPP_INSTANCE_ID}`

const whatsappSendMessageResponseSchema = z.object({
  messaging_product: z.string(),
  contacts: z.array(
    z.object({
      input: z.string(),
      wa_id: z.string(),
    }),
  ),
  messages: z.array(
    z.object({
      id: z.string(),
      message_status: z.string().optional(),
    }),
  ),
})

export class WhatsappService {
  private httpClient = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${env.WHATSAPP_INSTANCE_TOKEN}` },
  })

  private formatNumber(phoneNumber: string) {
    const p = phoneNumber.replace(/\D/g, "").slice(-9)

    if (p.length < 8) {
      return null
    }

    return `5551${p}`
  }

  async sendMessage(phoneNumber: string, message: string) {
    console.log(`Sending message to ${phoneNumber}`)
    try {
      const formattedNumber = this.formatNumber(phoneNumber)

      if (!formattedNumber) {
        console.log(`Number ${phoneNumber} is not on WhatsApp`)
        return
      }

      const res = await this.httpClient.post("/messages", {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "text",
        text: { body: message },
      })

      const parsed = whatsappSendMessageResponseSchema.parse(res.data)

      console.log("Message sent")

      return parsed
    } catch (e) {
      if (isAxiosError(e)) {
        console.log("Error sending message")
        console.log(e.response?.data)
      }
      if (e instanceof z.ZodError) {
        console.log("Error parsing response")
        console.log(e.errors)
      }
    }
  }
}

const wpp = new WhatsappService()

await wpp.sendMessage("980223200", "Hello, world!")

// const wpp = new WhatsappService()

// console.log(wpp.formatNumber("+55 11 99999-9999"))
// console.log(wpp.formatNumber("11 99999-9999"))
// console.log(wpp.formatNumber("99999-9999"))
// console.log(wpp.formatNumber("8888-8888"))
// console.log(wpp.formatNumber("777-7777"))
// console.log(wpp.formatNumber("666-666"))
// console.log(wpp.formatNumber("22"))
// console.log(wpp.formatNumber("1"))
