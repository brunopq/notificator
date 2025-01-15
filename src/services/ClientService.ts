import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import type { db as database } from "@/database"
import { client } from "@/database/schema"

export const selectClientSchema = createSelectSchema(client, {
  phones: z.array(z.string()),
})
const insertClientSchema = createInsertSchema(client, {
  phones: z.array(z.string()),
})

type Client = z.infer<typeof selectClientSchema>
type NewClient = z.infer<typeof insertClientSchema>

export class ClientService {
  constructor(private db: typeof database) {}

  async getByJudiceId(judiceId: number) {
    const dbClient = await this.db.query.client.findFirst({
      where: (client, { eq }) => eq(client.judiceId, judiceId),
    })

    return dbClient
  }

  async createClient(newClient: NewClient) {
    const [createdClient] = await this.db
      .insert(client)
      .values(newClient)
      .returning()

    return createdClient
  }
}
