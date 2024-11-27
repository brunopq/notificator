import type { RequestHandler } from "express"

import { BadRequestError, NotFoundError } from "@/common/errors/HTTPError"
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

    res.json(notifications)
  }

  show: RequestHandler = async (req, res, next) => {
    const notificationId = req.params.id

    if (!notificationId) {
      throw new BadRequestError("Notification ID is required")
    }

    const notification = await this.notificationService.show(notificationId)

    if (!notification) {
      throw new NotFoundError(
        `Notification with ID ${notificationId} not found`,
      )
    }

    res.json(notification)
  }

  create: RequestHandler = async (req, res) => {
    const newNotification = req.body

    const parsedNotification = insertNotificationSchema.parse(newNotification)

    const notification =
      await this.notificationService.create(parsedNotification)

    res.json(notification)
  }

  send: RequestHandler = async (req, res) => {
    const notificationId = req.params.id

    if (!notificationId) {
      throw new BadRequestError("Notification ID is required")
    }

    const notification = await this.notificationService.send(notificationId)

    if (!notification) {
      throw new NotFoundError(
        `Notification with ID ${notificationId} not found`,
      )
    }

    res.json(notification)
  }
}

export default new NotificationController(NotificationService)
