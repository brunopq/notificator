import { Router } from "express"

import DependencyManager from "@/dependencyManager"

const emailRouter = Router()

const emailController = DependencyManager.getEmailTestController()

emailRouter.get("/", emailController.show)

export { emailRouter }
