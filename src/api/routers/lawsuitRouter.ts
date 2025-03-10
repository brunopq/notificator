import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const lawsuitRouter = Router()

const lawsuitController = DependencyManager.getLawsuitController()

lawsuitRouter.get("/", lawsuitController.index)
lawsuitRouter.get("/:id", lawsuitController.show)
lawsuitRouter.get("/cnj/:cnj", lawsuitController.showByCnj)
lawsuitRouter.post("/", lawsuitController.create)
lawsuitRouter.get("/judice/:judiceId", lawsuitController.showJudiceId)
lawsuitRouter.post("/judice/:judiceId", lawsuitController.fetchJudiceId)

export { lawsuitRouter }
