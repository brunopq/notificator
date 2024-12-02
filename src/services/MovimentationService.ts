import { isAfter } from "date-fns"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { db } from "@/database"
import { movimentation } from "@/database/schema"

import JudiceService from "./JudiceService"
import PublicationsService from "./PublicationsService"

const selectMovimentationSchema = createSelectSchema(movimentation)
export const insertMovimentationSchema = createInsertSchema(movimentation)

type Movimentation = z.infer<typeof selectMovimentationSchema>
type NewMovimentation = z.infer<typeof insertMovimentationSchema>

class MovimentationService {
  /**
   * Returns a list of the movimentations in the database
   */
  async getMovimentations() {
    return await db.query.movimentation.findMany()
  }

  /**
   * Returns a list of the movimentations in the database, with all the fields
   */
  async getFullMovimentations() {
    return await db.query.movimentation.findMany({
      with: {
        lawsuit: { with: { client: true } },
      },
    })
  }

  /**
   * Returns the movimentation by id, with all the fields
   */
  async getFullMovimentationById(id: string) {
    return await db.query.movimentation.findFirst({
      with: { lawsuit: { with: { client: true } } },
      where: (movimentation, { eq }) => eq(movimentation.id, id),
    })
  }

  /**
   * Returns the movimentation by judiceId
   */
  async getMovimentationByJudiceId(judiceId: number) {
    return await db.query.movimentation.findFirst({
      where: (movimentation, { eq }) => eq(movimentation.judiceId, judiceId),
    })
  }

  async createMovimentation(newMovimentation: NewMovimentation) {
    const [createdMovimentation] = await db
      .insert(movimentation)
      .values(newMovimentation)
      .returning()

    return createdMovimentation
  }

  /**
   * Updates the publcations that have been read and
   * creates the movimentations, if they happened.
   */
  async fetchNewMovimentations() {
    const closedPublications =
      await PublicationsService.fetchClosedPublications()

    console.log(`${closedPublications.length} closed publications`)

    const promises = closedPublications.map((p, i) =>
      (async () => {
        const audiencias = await JudiceService.getAudienciasByJudiceId(
          Number(p.lawsuit.judiceId),
        )

        // the movimentation that happened because of the publication
        const createdAudiencia = audiencias.find((a) =>
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          isAfter(a.lastModification!, p.expeditionDate),
        )

        if (
          !createdAudiencia ||
          !createdAudiencia.date ||
          !createdAudiencia.judiceId ||
          !createdAudiencia.lastModification
        ) {
          return null
        }

        const dbMovimentation = await this.getMovimentationByJudiceId(
          createdAudiencia.judiceId,
        )

        if (dbMovimentation) {
          return null
        }

        const newMovimentation = await this.createMovimentation({
          judiceId: createdAudiencia.judiceId,
          type: createdAudiencia.type === "audiencia" ? "AUDIENCIA" : "PERICIA",
          expeditionDate: createdAudiencia.lastModification,
          finalDate: createdAudiencia.date,
          lawsuitId: p.lawsuitId,
        })

        // sets the movimentation id
        closedPublications[i].movimentationId = newMovimentation.id

        return newMovimentation
      })(),
    )

    const results = await Promise.allSettled(promises)

    for (const r of results) {
      if (r.status === "rejected") {
        console.log(r.reason)
      }
    }

    const created = results
      .filter((r) => r.status === "fulfilled")
      .filter((r) => r.value !== null) // strips off null
      .map((r) => r.value) as Movimentation[] // strips off null from typescript

    // updates publications statuses
    await Promise.all(
      closedPublications.map((p) =>
        PublicationsService.update(p.id, { ...p, hasBeenTreated: true }),
      ),
    )

    return created
  }
}

export default new MovimentationService()
