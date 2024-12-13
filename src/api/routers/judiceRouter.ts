import { Router } from "express"

import JudiceController from "@/controllers/JudiceController"

const judiceRouter = Router()

judiceRouter.get("/logoff", JudiceController.logoff)
judiceRouter.get("/publications", JudiceController.indexPublications)
judiceRouter.get("/publications/:judiceId", JudiceController.showPublication)
judiceRouter.get("/lawsuits/:cnj", JudiceController.showLawsuit)
judiceRouter.get("/lawsuits/:cnj/audiencias", JudiceController.showAudiencias)
// judiceRouter.get("/lawsuits/:cnj/audiencias/:audienciaId", JudiceController.showAudiencia)
judiceRouter.get("/clients/:judiceId", JudiceController.showClient)

export { judiceRouter }
