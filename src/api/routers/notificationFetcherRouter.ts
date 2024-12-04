import { Router } from "express"

import NotificationFetcherController from "@/controllers/NotificationFetcherController"

const notificationFetcherRouter = Router()

notificationFetcherRouter.post(
  "/fetchAndSend",
  NotificationFetcherController.fetchAndSendNotifications,
)

export { notificationFetcherRouter }
