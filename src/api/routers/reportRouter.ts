import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const reportRouter = Router()

const reportController = DependencyManager.getReportController()

reportRouter.get("/notifications", reportController.sendNotificationReport)

export { reportRouter }
