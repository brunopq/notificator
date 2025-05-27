import type { RequestHandler } from "express"
import { inject } from "inversify"

import { BadRequestError, NotFoundError } from "@/common/errors/HTTPError"
import { paginationInputSchema } from "@/common/models/pagination"

import { insertNotificationSchema } from "@/models/Notification"
import { NotificationService } from "@/services/NotificationService"

export class NotificationController {
  constructor(
    @inject(NotificationService)
    private notificationService: NotificationService,
  ) {}

  index: RequestHandler = async (req, res) => {
    const pagination = paginationInputSchema.parse(req.query)

    const notifications = await this.notificationService.index(pagination)

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
