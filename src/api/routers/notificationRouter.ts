import { Router } from "express"

import NotificationController from "@/controllers/NotificationController"

const notificationRouter = Router()

notificationRouter.get("/", NotificationController.index)
notificationRouter.get("/:id", NotificationController.show)
notificationRouter.post("/", NotificationController.create)
notificationRouter.post("/:id/send", NotificationController.send)

export { notificationRouter }
