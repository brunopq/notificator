import { endOfDay, startOfDay } from "date-fns"
import { and, asc, between, desc, eq, inArray } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import { inject, injectable } from "inversify"
import type { z } from "zod"

import type { db as database } from "@/database"
import {
  execution,
  notification,
  notificationSnapshot,
} from "@/database/schema"
import type { NotificationStatus } from "@/services/NotificationService"

const executionSchema = createSelectSchema(execution)
type Execution = z.infer<typeof executionSchema>

@injectable()
export class ExecutionService {
  constructor(@inject("database") private readonly db: typeof database) {}

  async create(): Promise<Execution> {
    const [exec] = await this.db.insert(execution).values({}).returning()

    return exec
  }

  async list(
    day: Date,
    statuses: NotificationStatus[] | undefined,
  ): Promise<Execution[]> {
    let condition = between(execution.createdAt, startOfDay(day), endOfDay(day))

    if (statuses && statuses.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      condition = and(
        condition,
        inArray(notificationSnapshot.status, statuses),
      )!
    }

    const dbStuff = await this.db
      .select()
      .from(execution)
      .leftJoin(
        notificationSnapshot,
        eq(execution.id, notificationSnapshot.executionId),
      )
      .leftJoin(
        notification,
        eq(notificationSnapshot.notificationId, notification.id),
      )
      .where(condition)
      .orderBy(desc(execution.createdAt), asc(notification.status))

    // this aggregates the data in a sensible manner
    // biome-ignore lint/suspicious/noExplicitAny: typing this shit is too hard, any it is
    const executions = new Map<string, any>()

    for (const stuff of dbStuff) {
      const thisExecId = stuff.executions.id

      if (!executions.has(thisExecId)) {
        executions.set(thisExecId, {
          ...stuff.executions,
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          notificationSnapshots: new Map<string, any>(),
        })
      }

      const exec = executions.get(thisExecId)

      const thisSnapId = stuff.notification_snapshots?.id

      if (!thisSnapId) continue

      if (!exec.notificationSnapshots.has(thisSnapId)) {
        exec.notificationSnapshots.set(thisSnapId, {
          ...stuff.notification_snapshots,
          notification: stuff.notifications,
        })
      }
    }

    return executions
      .values()
      .map((e) => ({
        ...e,
        notificationSnapshots: e.notificationSnapshots.values().toArray(),
      }))
      .toArray()
  }
}
