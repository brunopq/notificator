import { Router } from "express"

import DependencyManager from "@/dependencyManager"

export const executionRouter = Router()

const executionController = DependencyManager.getExecutionController()

executionRouter.get("/", executionController.index)
