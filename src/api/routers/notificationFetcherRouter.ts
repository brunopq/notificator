import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const notificationFetcherRouter = Router()

const notificationFetcherController =
  DependencyManager.getNotificationFetcherController()

notificationFetcherRouter.post(
  "/fetchAndSend",
  notificationFetcherController.fetchAndSendNotifications,
)

export { notificationFetcherRouter }
