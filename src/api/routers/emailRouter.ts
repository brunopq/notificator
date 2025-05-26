import { Router } from "express"

import { EmailTestController } from "@/controllers/EmailTestController"

import dependencyManager from "@/dependencyManager"

const emailRouter = Router()

const emailController = dependencyManager.get(EmailTestController)

emailRouter.get("/", emailController.show)

export { emailRouter }
