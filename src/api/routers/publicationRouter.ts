import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const publicationRouter = Router()

const publicationController = DependencyManager.getPublicationController()

publicationRouter.get("/", publicationController.index)
publicationRouter.get("/:id", publicationController.show)
publicationRouter.post("/", publicationController.create)
publicationRouter.post("/fetch", publicationController.fetch)
publicationRouter.post("/fetch/closed", publicationController.fetchClosed)

export { publicationRouter }
