import { Router } from "express"

import DependencyManager from "@/dependencyManager"

import { notificationFetcherRouter } from "./notificationFetcherRouter"

const notificationRouter = Router()

const notificationController = DependencyManager.getNotificationController()

notificationRouter.get("/", notificationController.index)
notificationRouter.get("/:id", notificationController.show)
notificationRouter.post("/", notificationController.create)
notificationRouter.post("/:id/send", notificationController.send)

notificationRouter.use("/fetcher", notificationFetcherRouter)

export { notificationRouter }
