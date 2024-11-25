import { compareDesc, isAfter, isBefore, parse } from "date-fns"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { db } from "@/database"
import { lawsuit, publication } from "@/database/schema"

import { eq } from "drizzle-orm"
import JudiceService from "./JudiceService"
import LawsuitService from "./LawsuitService"
import MovimentationService from "./MovimentationService"

const selectPublicationSchema = createSelectSchema(publication)
export const insertPublicationSchema = createInsertSchema(publication)

type Publication = z.infer<typeof selectPublicationSchema>
type NewPublication = z.infer<typeof insertPublicationSchema>

class PublicationsService {
  async listPublications() {
    return await db.query.publication.findMany()
  }
  async listPublicationsWithLawsuit() {
    return await db.query.publication.findMany({ with: { lawsuit: true } })
  }
  async listPublicationsWithLawsuitAndClient() {
    return await db.query.publication.findMany({
      with: { lawsuit: { with: { client: true } } },
    })
  }
  async listPublicationsWithEverything() {
    return await db.query.publication.findMany({
      with: { lawsuit: { with: { client: true } }, movimentation: true },
    })
  }

  /**
   * Returns the publication with the given id,
   * including lawsuit and movimentation details.
   */
  async getById(id: string) {
    return await db.query.publication.findFirst({
      where: eq(publication.id, id),
      with: {
        lawsuit: { with: { client: true } },
        movimentation: true,
      },
    })
  }

  async createPublication(newPublication: NewPublication) {
    const [createdPublication] = await db
      .insert(publication)
      .values(newPublication)
      .returning()

    return createdPublication
  }

  async createPublicationByJudiceId(judiceId: number) {
    const publicationData =
      await JudiceService.getPublicationByJudiceId(judiceId)

    const lawsuit = await LawsuitService.getOrCreateByCNJ(
      publicationData.info[0].f_number,
    )

    if (!lawsuit) {
      console.log("lawsuit not found")
      return null
    }

    return this.createPublication({
      expeditionDate: parse(
        publicationData.info[0].f_publisher_date,
        "dd/MM/yyyy",
        new Date(),
      ),
      lawsuitId: lawsuit.id,
      judiceId,
    })
  }

  async getByJudiceId(id: number) {
    const dbPublication = await db.query.publication.findFirst({
      where: ({ judiceId }, { eq }) => eq(judiceId, id),
    })

    return dbPublication
  }

  async getOrCreateByJudiceId(id: number) {
    const dbPub = await this.getByJudiceId(id)

    if (dbPub) {
      return dbPub
    }

    const createdPublication = await this.createPublicationByJudiceId(id)

    return createdPublication
  }

  /**
   * Returns a list of all the current publications
   * available in the judice system.
   *
   * Reads and inserts them in the database if they're
   * not already created.
   */
  async fetchPublications() {
    const publications = await JudiceService.getPublications()

    const promises = publications.map((p) =>
      this.getOrCreateByJudiceId(p.judiceId),
    )

    const results = await Promise.allSettled(promises)

    const fulfilled: Publication[] = []
    const rejected: unknown[] = []

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        fulfilled.push(result.value)
      } else {
        rejected.push(result)
      }
    }

    return fulfilled
  }

  async fetchClosedPublications() {
    const judicePublications = new Set(
      (await this.fetchPublications()).map((p) => p.judiceId),
    )
    const dbOpenPublications = await db.query.publication.findMany({
      where: ({ hasBeenTreated }, { eq }) => eq(hasBeenTreated, false),
      with: { lawsuit: true },
    })

    const closedPublications = dbOpenPublications.filter(
      (p) => !judicePublications.has(p.judiceId),
    )

    return closedPublications
  }

  async update(
    id: string,
    updatePublication: Partial<Omit<NewPublication, "id">>,
  ) {
    const [updated] = await db
      .update(publication)
      .set({
        expeditionDate: updatePublication.expeditionDate,
        hasBeenTreated: updatePublication.hasBeenTreated,
        movimentationId: updatePublication.movimentationId,
        lawsuitId: updatePublication.lawsuitId,
      })
      .where(eq(publication.id, id))
      .returning()

    return updated
  }

  async updateStatuses(publicationId: string, movimentationId: string) {
    const [updated] = await db
      .update(publication)
      .set({ movimentationId, hasBeenTreated: true })
      .where(eq(publication.id, publicationId))
      .returning()

    return updated
  }
}

export default new PublicationsService()
