import { eq } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { db } from "@/database"
import { notification } from "@/database/schema"

import WhatsappService from "./WhatsappService"

const selectNotificationSchema = createSelectSchema(notification)
export const insertNotificationSchema = z.object({
  movimentationId: z.string(),
  clientId: z.string(),
  message: z.string(),
  sent: z.boolean().default(false),
  recieved: z.boolean().default(false),
})

export type Notification = z.infer<typeof selectNotificationSchema>
type NewNotification = z.infer<typeof insertNotificationSchema>

class NotificationService {
  private WhatsappService: typeof WhatsappService

  constructor(whatsappService: typeof WhatsappService) {
    this.WhatsappService = whatsappService
  }

  async index() {
    return await db.query.notification.findMany({
      with: {
        client: true,
      },
    })
  }

  async show(id: string) {
    const notification = await db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true, movimentation: true },
    })

    if (!notification) {
      return undefined
    }

    return notification
  }

  async create(newNotification: NewNotification) {
    const [createdNotification] = await db
      .insert(notification)
      .values(newNotification)
      .returning()

    return createdNotification
  }

  async send(id: string) {
    const noti = await db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true },
    })

    if (!noti) {
      throw new Error("Notification not found")
    }

    if (noti.sent) {
      throw new Error("Notification already sent")
    }

    if (!noti.client) {
      throw new Error("Client not found or without phones")
    }

    if (noti.client.phones.length === 0) {
      throw new Error("Client has no phones")
    }

    const phone = "51 98022-3200"

    const sentMessage = await this.WhatsappService.sendMessage(
      phone,
      noti.message,
    )

    console.log(sentMessage)

    if (!sentMessage) {
      throw new Error("Message not sent")
    }

    const [updated] = await db
      .update(notification)
      .set({ sent: true })
      .where(eq(notification.id, id))
      .returning()

    return updated
  }
}

export default new NotificationService(WhatsappService)
