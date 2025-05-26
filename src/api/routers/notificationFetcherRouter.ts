import { Router } from "express"

import { NotificationFetcherController } from "@/controllers/NotificationFetcherController"

import dependencyManager from "@/dependencyManager"

const notificationFetcherRouter = Router()

const notificationFetcherController = dependencyManager.get(
  NotificationFetcherController,
)

notificationFetcherRouter.post(
  "/fetchAndSend",
  notificationFetcherController.fetchAndSendNotifications,
)

export { notificationFetcherRouter }
