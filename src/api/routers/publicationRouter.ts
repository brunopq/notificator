import { Router } from "express"

import PublicationController from "@/controllers/PublicationController"

const publicationRouter = Router()

publicationRouter.get("/", PublicationController.index)
publicationRouter.get("/:id", PublicationController.show)
publicationRouter.post("/", PublicationController.create)
publicationRouter.post("/fetch", PublicationController.fetch)
publicationRouter.post("/fetch/closed", PublicationController.fetchClosed)

export { publicationRouter }
