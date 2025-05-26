import { Router } from "express"

import { NotificationController } from "@/controllers/NotificationController"

import dependencyManager from "@/dependencyManager"

import { notificationFetcherRouter } from "./notificationFetcherRouter"

const notificationRouter = Router()

const notificationController = dependencyManager.get(NotificationController)

notificationRouter.get("/", notificationController.index)
notificationRouter.get("/:id", notificationController.show)
notificationRouter.post("/", notificationController.create)
notificationRouter.post("/:id/send", notificationController.send)

notificationRouter.use("/fetcher", notificationFetcherRouter)

export { notificationRouter }
