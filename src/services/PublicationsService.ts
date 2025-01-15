import { eq } from "drizzle-orm"
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import type { z } from "zod"

import { Paginated, PaginationInput } from "@/common/models/pagination"

import type { db as database } from "@/database"
import { publication } from "@/database/schema"

const selectPublicationSchema = createSelectSchema(publication)
export const insertPublicationSchema = createInsertSchema(publication)

export type Publication = z.infer<typeof selectPublicationSchema>
type NewPublication = z.infer<typeof insertPublicationSchema>

export class PublicationsService {
  constructor(private db: typeof database) {}

  // simple
  async listPublications(pagination: PaginationInput): Promise<Paginated<typeof selectPublicationSchema>> {
    const publicationsCount = await this.db.$count(publication)

    const publications =await this.db.query.publication.findMany({
      limit: pagination.limit,
      offset: pagination.offset,
    })

    return {
      data: publications,
      total: publicationsCount ,
      limit: pagination.limit,
      offset: pagination.offset,
    }
  }
  // simple
  async listPublicationsWithLawsuit() {
    return await this.db.query.publication.findMany({ with: { lawsuit: true } })
  }
  // simple
  async listPublicationsWithLawsuitAndClient() {
    return await this.db.query.publication.findMany({
      with: { lawsuit: { with: { client: true } } },
    })
  }
  // simple
  async listPublicationsWithEverything() {
    return await this.db.query.publication.findMany({
      with: { lawsuit: { with: { client: true } }, movimentation: true },
    })
  }

  async listOpenPublications() {
    return this.db.query.publication.findMany({
      where: ({ hasBeenTreated }, { eq }) => eq(hasBeenTreated, false),
      with: { lawsuit: true },
    })
  }

  /**
   * Returns the publication with the given id,
   * including lawsuit and movimentation details.
   */
  // simple
  async getById(id: string) {
    return await this.db.query.publication.findFirst({
      where: eq(publication.id, id),
      with: {
        lawsuit: { with: { client: true } },
        movimentation: true,
      },
    })
  }

  // simple
  async getByJudiceId(id: number) {
    const dbPublication = await this.db.query.publication.findFirst({
      where: ({ judiceId }, { eq }) => eq(judiceId, id),
    })

    return dbPublication
  }

  // simple
  async createPublication(newPublication: NewPublication) {
    const [createdPublication] = await this.db
      .insert(publication)
      .values(newPublication)
      .returning()

    return createdPublication
  }

  // simple
  async update(
    id: string,
    updatePublication: Partial<Omit<NewPublication, "id">>,
  ) {
    const [updated] = await this.db
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

  // simple
  async updateStatuses(publicationId: string, movimentationId: string) {
    const [updated] = await this.db
      .update(publication)
      .set({ movimentationId, hasBeenTreated: true })
      .where(eq(publication.id, publicationId))
      .returning()

    return updated
  }
}
