export type WhatsappError = "not_on_whatsapp" | "unknown"

export type WhatsappResponse =
  | { error: WhatsappError; data?: undefined }
  | { data: unknown; error?: undefined }

export interface IWhatsappService {
  sendMessage(phoneNumber: string, message: string): Promise<WhatsappResponse>
}
