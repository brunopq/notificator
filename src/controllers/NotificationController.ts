import type { RequestHandler } from "express"

import NotificationService, {
  insertNotificationSchema,
} from "@/services/NotificationService"

class NotificationController {
  private notificationService: typeof NotificationService

  constructor(notificationService: typeof NotificationService) {
    this.notificationService = notificationService
  }

  index: RequestHandler = async (_req, res) => {
    const notifications = await this.notificationService.index()

    return res.json(notifications)
  }

  show: RequestHandler = async (req, res) => {
    const notificationId = req.params.id

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" })
    }

    const notification = await this.notificationService.show(notificationId)

    return res.json(notification)
  }

  create: RequestHandler = async (req, res) => {
    const newNotification = req.body

    const parsedNotification =
      insertNotificationSchema.safeParse(newNotification)

    if (!parsedNotification.success) {
      return res.status(400).json({
        message: "Invalid notification data",
        errors: parsedNotification.error.errors,
      })
    }

    const notification = await this.notificationService.create(
      parsedNotification.data,
    )

    return res.json(notification)
  }

  send: RequestHandler = async (req, res) => {
    const notificationId = req.params.id

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required" })
    }

    const notification = await this.notificationService.send(notificationId)

    return res.json(notification)
  }
}

export default new NotificationController(NotificationService)
