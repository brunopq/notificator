import axios from "axios"

import { env } from "@/common/utils/envConfig"

class WhatsappService {
  private httpClient = axios.create({
    baseURL: env.WHATSAPP_SERVICE_URL,
  })
  async isOnWhatsapp(phoneNumber: string) {
    const res = await this.httpClient.post("/isOnWhatsapp", {
      number: phoneNumber,
    })

    if (res.data.exists) {
      return res.data.jid
    }

    return false
  }

  async sendMessage(phoneNumber: string, message: string) {
    const res = await this.httpClient.post("/sendMessage", {
      number: phoneNumber,
      message,
    })

    if (res.status !== 200) {
      throw new Error("Message not sent")
    }

    return res.data
  }
}

export default new WhatsappService()
