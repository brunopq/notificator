import type { RequestHandler } from "express"
import { z } from "zod"

import { BadRequestError, NotFoundError } from "@/common/errors/HTTPError"
import { paginationInputSchema } from "@/common/models/pagination"

import type { ExecutionService } from "@/services/ExecutionService"

const afterSchema = z.object({
  after: z
    .date({
      coerce: true,
    })
    .optional(),
})

export class ExecutionController {
  constructor(private executionService: ExecutionService) {}

  index: RequestHandler = async (req, res) => {
    const { after } = afterSchema.parse(req.query)

    const executions = await this.executionService.list(after)

    res.json(executions)
  }
}
