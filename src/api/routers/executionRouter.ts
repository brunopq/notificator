import { Router } from "express"

import { ExecutionController } from "@/controllers/ExecutionController"

import dependencyManager from "@/dependencyManager"

export const executionRouter = Router()

const executionController = dependencyManager.get(ExecutionController)

executionRouter.get("/", executionController.index)
