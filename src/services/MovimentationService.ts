import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import type { db as database } from "@/database"
import { movimentation } from "@/database/schema"

const selectMovimentationSchema = createSelectSchema(movimentation)
export const insertMovimentationSchema = createInsertSchema(movimentation)

export type Movimentation = z.infer<typeof selectMovimentationSchema>
type NewMovimentation = z.infer<typeof insertMovimentationSchema>

export class MovimentationService {
  constructor(private db: typeof database) {}

  // simple
  /**
   * Returns a list of the movimentations in the database
   */
  async getMovimentations() {
    return await this.db.query.movimentation.findMany()
  }

  // simple
  /**
   * Returns a list of the movimentations in the database, with all the fields
   */
  async getFullMovimentations() {
    return await this.db.query.movimentation.findMany({
      with: {
        lawsuit: { with: { client: true } },
      },
    })
  }

  // simple
  /**
   * Returns the movimentation by id, with all the fields
   */
  async getFullMovimentationById(id: string) {
    return await this.db.query.movimentation.findFirst({
      with: { lawsuit: { with: { client: true } } },
      where: (movimentation, { eq }) => eq(movimentation.id, id),
    })
  }

  // simple
  /**
   * Returns the movimentation by judiceId
   */
  async getMovimentationByJudiceId(judiceId: number) {
    return await this.db.query.movimentation.findFirst({
      where: (movimentation, { eq }) => eq(movimentation.judiceId, judiceId),
    })
  }

  // simple
  async createMovimentation(newMovimentation: NewMovimentation) {
    const [createdMovimentation] = await this.db
      .insert(movimentation)
      .values(newMovimentation)
      .returning()

    return createdMovimentation
  }
}
