import axios from "axios"

class WhatsappService {
  private httpClient = axios.create({
    baseURL: "http://localhost:3000/whatsapp",
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
