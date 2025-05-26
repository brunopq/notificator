import { Router } from "express"

import { MovimentationController } from "@/controllers/MovimentationController"

import dependencyManager from "@/dependencyManager"

const movimentationRouter = Router()

const movimentationController = dependencyManager.get(MovimentationController)

movimentationRouter.get("/", movimentationController.index)
movimentationRouter.get("/:id", movimentationController.show)
movimentationRouter.post("/", movimentationController.create)
movimentationRouter.post("/fetch", movimentationController.fetch)

export { movimentationRouter }
