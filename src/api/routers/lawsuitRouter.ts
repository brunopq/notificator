import { Router } from "express"

import { LawsuitController } from "@/controllers/LawsuitController"

import dependencyManager from "@/dependencyManager"

const lawsuitRouter = Router()

const lawsuitController = dependencyManager.get(LawsuitController)

lawsuitRouter.get("/", lawsuitController.index)
lawsuitRouter.get("/:id", lawsuitController.show)
lawsuitRouter.get("/cnj/:cnj", lawsuitController.showByCnj)
lawsuitRouter.post("/", lawsuitController.create)
lawsuitRouter.get("/judice/:judiceId", lawsuitController.showJudiceId)
lawsuitRouter.post("/judice/:judiceId", lawsuitController.fetchJudiceId)

export { lawsuitRouter }
