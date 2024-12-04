import { Router } from "express"

import { notificationFetcherRouter } from "./notificationFetcherRouter"

import NotificationController from "@/controllers/NotificationController"

const notificationRouter = Router()

notificationRouter.get("/", NotificationController.index)
notificationRouter.get("/:id", NotificationController.show)
notificationRouter.post("/", NotificationController.create)
notificationRouter.post("/:id/send", NotificationController.send)

notificationRouter.use("/fetcher", notificationFetcherRouter)

export { notificationRouter }
