import { parse } from "date-fns"

import type { JudiceService } from "./JudiceService"
import type { LawsuitJudiceService } from "./LawsuitJudiceService"
import type { Publication, PublicationsService } from "./PublicationsService"

export class PublicationJudiceService {
  constructor(
    private judiceService: JudiceService,
    private publicationService: PublicationsService,
    private lawsuitJudiceService: LawsuitJudiceService,
  ) {}

  async createPublicationByJudiceId(judiceId: number) {
    const publicationData =
      await this.judiceService.getPublicationByJudiceId(judiceId)

    const lawsuit = await this.lawsuitJudiceService.getOrCreateByCNJ(
      publicationData.info[0].f_number,
    )

    if (!lawsuit) {
      console.log("lawsuit not found")
      return null
    }

    return this.publicationService.createPublication({
      expeditionDate: parse(
        publicationData.info[0].f_publisher_date,
        "dd/MM/yyyy",
        new Date(),
      ),
      lawsuitId: lawsuit.id,
      judiceId,
    })
  }

  async getOrCreateByJudiceId(id: number) {
    const dbPub = await this.publicationService.getByJudiceId(id)

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
    const publications = await this.judiceService.getPublications()

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
    const dbOpenPublications =
      await this.publicationService.listOpenPublications()

    const closedPublications = dbOpenPublications.filter(
      (p) => !judicePublications.has(p.judiceId),
    )

    return closedPublications
  }
}
