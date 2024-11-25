import MovimentationController from "@/controllers/MovimentationController"

import { Router } from "express"

const movimentationRouter = Router()

movimentationRouter.get("/", MovimentationController.index)
movimentationRouter.get("/:id", MovimentationController.show)
movimentationRouter.post("/", MovimentationController.create)
movimentationRouter.post("/fetch", MovimentationController.fetch)

export { movimentationRouter }
