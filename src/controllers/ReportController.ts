import type { RequestHandler } from "express"

import type { SendNotificationsReportUseCase } from "@/useCases/SendNotificationsReportUseCase"

export class ReportController {
  constructor(
    private sendNotificationsReportUseCase: SendNotificationsReportUseCase,
  ) {}

  sendNotificationReport: RequestHandler = async (req, res) => {
    const report = await this.sendNotificationsReportUseCase.execute()

    res.sendStatus(200)
  }
}
