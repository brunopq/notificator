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

type Notification = z.infer<typeof selectNotificationSchema>
type NewNotification = z.infer<typeof insertNotificationSchema>

class NotificationService {
  async index() {
    return await db.query.notification.findMany({
      with: {
        client: true,
      },
    })
  }

  async show(id: string) {
    return await db.query.notification.findFirst({
      where: (n, { eq }) => eq(n.id, id),
      with: { client: true, movimentation: true },
    })
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

    if (!noti || noti.sent) {
      throw new Error("Notification not found or already sent")
    }

    if (!noti.client || noti.client.phones.length === 0) {
      throw new Error("Client not found or without phones")
    }

    const phone = "51 98022-3200"

    const sentMessage = await WhatsappService.sendMessage(phone, noti.message)

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

export default new NotificationService()
