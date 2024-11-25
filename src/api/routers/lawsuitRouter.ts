import LawsuitController from "@/controllers/LawsuitController"
import { Router } from "express"

const lawsuitRouter = Router()

lawsuitRouter.get("/", LawsuitController.index)
lawsuitRouter.get("/:cnj", LawsuitController.show)
lawsuitRouter.post("/", LawsuitController.create)

export { lawsuitRouter }
