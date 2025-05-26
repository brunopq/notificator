import { Router } from "express"

import { ClientController } from "@/controllers/ClientController"

import dependencyManager from "@/dependencyManager"

const clientRouter = Router()

const clientController = dependencyManager.get(ClientController)

clientRouter.get("/:id", clientController.show)

export { clientRouter }
