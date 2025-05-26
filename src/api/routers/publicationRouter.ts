import { Router } from "express"

import { PublicationController } from "@/controllers/PublicationController"

import dependencyManager from "@/dependencyManager"

const publicationRouter = Router()

const publicationController = dependencyManager.get(PublicationController)

publicationRouter.get("/", publicationController.index)
publicationRouter.get("/:id", publicationController.show)
publicationRouter.post("/", publicationController.create)
publicationRouter.post("/fetch", publicationController.fetch)
publicationRouter.post("/fetch/closed", publicationController.fetchClosed)

export { publicationRouter }
