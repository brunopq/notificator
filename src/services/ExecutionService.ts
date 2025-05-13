import type { db as database } from "@/database"
import { createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { execution } from "@/database/schema"

const executionSchema = createSelectSchema(execution)
type Execution = z.infer<typeof executionSchema>

export class ExecutionService {
  constructor(private readonly db: typeof database) {}

  async create(): Promise<Execution> {
    const [exec] = await this.db.insert(execution).values({}).returning()

    return exec
  }

  async list(after?: Date): Promise<Execution[]> {
    const executions = await this.db.query.execution.findMany({
      where: (ex, { gt }) => after && gt(ex.createdAt, after),
      with: {
        notificationSnapshots: {
          with: { notification: true },
        },
      },
    })

    return executions
  }
}
