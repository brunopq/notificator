import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const agendaRouter = Router()

const agendaController = DependencyManager.getAgendaController()

agendaRouter.get(
  "/handleNotificationAppointments",
  agendaController.handleNotificationTasks,
)
// agendaRouter.get("/publications/:agendaId", agendaController.showPublication)
// agendaRouter.get("/lawsuits/:cnj", agendaController.showLawsuit)
// agendaRouter.get("/lawsuits/:cnj/audiencias", agendaController.showAudiencias)
// agendaRouter.get("/clients/:agendaId", agendaController.showClient)

export { agendaRouter }
