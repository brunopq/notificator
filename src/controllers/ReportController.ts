import type { RequestHandler } from "express"
import { inject } from "inversify"

import { SendNotificationsReportUseCase } from "@/useCases/SendNotificationsReportUseCase"

export class ReportController {
  constructor(
    @inject(SendNotificationsReportUseCase)
    private sendNotificationsReportUseCase: SendNotificationsReportUseCase,
  ) {}

  sendNotificationReport: RequestHandler = async (req, res) => {
    const report = await this.sendNotificationsReportUseCase.execute(new Date())

    res.sendStatus(200)
  }
}
