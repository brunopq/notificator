import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const judiceRouter = Router()

const judiceController = DependencyManager.getJudiceController()

judiceRouter.get("/logoff", judiceController.logoff)
judiceRouter.get("/publications", judiceController.indexPublications)
judiceRouter.get("/publications/:judiceId", judiceController.showPublication)
judiceRouter.get("/lawsuits/:cnj", judiceController.showLawsuit)
judiceRouter.get("/lawsuits/:cnj/audiencias", judiceController.showAudiencias)
// judiceRouter.get("/lawsuits/:cnj/audiencias/:audienciaId", judiceController.showAudiencia)
judiceRouter.get("/clients/:judiceId", judiceController.showClient)

export { judiceRouter }
