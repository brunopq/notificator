import type { JudiceService } from "@/services/JudiceService"
import type { RequestHandler } from "express"

export class AgendaController {
  constructor(private readonly judiceService: JudiceService) {}

  handleNotificationTasks: RequestHandler = async (_req, _res) => {
    await this.judiceService.getAgendaCSV()
  }
}
