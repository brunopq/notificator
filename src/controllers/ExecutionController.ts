import type { RequestHandler } from "express"
import { z } from "zod"

import type { ExecutionService } from "@/services/ExecutionService"
import { notificationStatusSchema } from "@/services/NotificationService"

const indexQuerySchema = z.object({
  day: z.date({ coerce: true }),
  notificationStatuses: z.array(notificationStatusSchema).optional(),
})

export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  index: RequestHandler = async (req, res) => {
    const rawDay = req.query.day
    let rawStatuses = req.query.notificationStatuses

    if (typeof rawStatuses === "string" && rawStatuses !== "") {
      rawStatuses = rawStatuses.split(",")
    } else {
      rawStatuses = undefined
    }

    const { day, notificationStatuses } = indexQuerySchema.parse({
      day: rawDay,
      notificationStatuses: rawStatuses,
    })

    const executions = await this.executionService.list(
      day,
      notificationStatuses,
    )

    res.json(executions)
  }
}
