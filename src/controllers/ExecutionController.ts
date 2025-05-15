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
    // const rawNotificationStatuses = req.query.notificationStatuses

    const { day, notificationStatuses } = indexQuerySchema.parse({
      day: rawDay,
      notificationStatuses: [],
    })

    const executions = await this.executionService.list(
      day,
      notificationStatuses,
    )

    res.json(executions)
  }
}
