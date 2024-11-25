import { Router } from "express"

import NotificationController from "@/controllers/NotificationController"

const notificationRouter = Router()

notificationRouter.get("/", NotificationController.index)
notificationRouter.get("/:id", NotificationController.show)
notificationRouter.post("/", NotificationController.create)

export { notificationRouter }
