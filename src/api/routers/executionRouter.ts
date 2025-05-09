import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const executionRouter = Router()

const executionController = DependencyManager.getExecutionController()

executionRouter.get("/", executionController.index)
