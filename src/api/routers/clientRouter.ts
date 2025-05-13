import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const clientRouter = Router()

const clientController = DependencyManager.getClientController()

clientRouter.get("/:id", clientController.show)

export { clientRouter }
