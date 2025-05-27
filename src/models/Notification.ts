import {
  notification,
  notificationErrors,
  notificationStatus,
} from "@/database/schema"
import { selectClientSchema } from "@/services/ClientService"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"

const selectNotificationSchema = createSelectSchema(notification)
export const notificationWithClientSchema = selectNotificationSchema.extend({
  client: selectClientSchema,
})
export const notificationErrorsSchema = z.enum(notificationErrors.enumValues)
export const notificationStatusSchema = z.enum(notificationStatus.enumValues)

export type NotificationStatus = z.infer<typeof notificationStatusSchema>

export const insertNotificationSchema = z.object({
  movimentationId: z.string(),
  clientId: z.string(),
  message: z.string(),
  sentAt: z.date().nullish(),
  recieved: z.boolean().default(false),
  scheduleArn: z.string().nullish(),
  status: notificationStatusSchema,
  error: notificationErrorsSchema.nullish(),
})

export type Notification = z.infer<typeof selectNotificationSchema>
export type NewNotification = z.infer<typeof insertNotificationSchema>

export type NotificationError = z.infer<typeof notificationErrorsSchema>
