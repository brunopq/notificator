import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const movimentationRouter = Router()

const movimentationController = DependencyManager.getMovimentationController()

movimentationRouter.get("/", movimentationController.index)
movimentationRouter.get("/:id", movimentationController.show)
movimentationRouter.post("/", movimentationController.create)
movimentationRouter.post("/fetch", movimentationController.fetch)

export { movimentationRouter }
