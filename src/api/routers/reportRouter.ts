import { Router } from "express"

import { ReportController } from "@/controllers/ReportController"

import dependencyManager from "@/dependencyManager"

const reportRouter = Router()

const reportController = dependencyManager.get(ReportController)

reportRouter.get("/notifications", reportController.sendNotificationReport)

export { reportRouter }
