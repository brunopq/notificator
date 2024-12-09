import axios, { isAxiosError } from "axios"
import { z } from "zod"

import { env } from "@/common/utils/envConfig"

const whatsappNumbersResponseSchema = z.array(
  z.object({
    jid: z.string(),
    exists: z.boolean(),
  }),
)

class WhatsappService {
  private httpClient = axios.create({
    baseURL: env.WHATSAPP_SERVICE_URL,
    headers: { authorization: `bearer ${env.WHATSAPP_INSTANCE_TOKEN}` },
  })
  async isOnWhatsapp(phoneNumber: string) {
    const res = await this.httpClient.post(
      `/chat/whatsappNumbers/${env.WHATSAPP_INSTANCE_ID}`,
      { number: phoneNumber },
    )

    const parsed = whatsappNumbersResponseSchema.safeParse(res.data)

    if (!parsed.success) {
      console.log("Could not parse /chat/whatsappNumbers response")
      return { exists: false as false }
    }

    const numbers = parsed.data

    if (numbers.length === 0 || !numbers[0].exists) {
      return { exists: false as false }
    }

    return {
      exists: true as true,
      jid: numbers[0].jid,
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    try {
      const jid = await this.isOnWhatsapp(phoneNumber)

      if (!jid.exists) {
        console.log(`Number ${phoneNumber} is not on WhatsApp`)
        return
      }

      const res = await this.httpClient.post(
        `/message/sendText/${env.WHATSAPP_INSTANCE_ID}`,
        {
          number: jid.jid,
          textMessage: { text: message },
        },
      )

      return res.data
    } catch (e) {
      if (isAxiosError(e)) {
        console.log("Error sending message")
        console.log(e.response?.data)
      }
    }
  }
}

export default new WhatsappService()
