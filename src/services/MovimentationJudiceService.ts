import { isAfter } from "date-fns"
import type { JudiceService } from "./JudiceService"
import type {
  Movimentation,
  MovimentationService,
} from "./MovimentationService"
import type { PublicationJudiceService } from "./PublicationJudiceService"
import type { PublicationsService } from "./PublicationsService"

export class MovimentationJudiceService {
  constructor(
    private movimentationService: MovimentationService,
    private judiceService: JudiceService,
    private publicationsService: PublicationsService,
    private publicationJudiceService: PublicationJudiceService,
  ) {}

  /**
   * Updates the publcations that have been read and
   * creates the movimentations, if they happened.
   */
  async fetchNewMovimentations() {
    const closedPublications =
      await this.publicationJudiceService.fetchClosedPublications()

    console.log(`${closedPublications.length} closed publications`)

    const promises = closedPublications.map((p, i) =>
      (async () => {
        const audiencias = await this.judiceService.getAudienciasByJudiceId(
          p.lawsuit.judiceId,
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

        const dbMovimentation =
          await this.movimentationService.getMovimentationByJudiceId(
            createdAudiencia.judiceId,
          )

        // don't create movimentation twice
        // don't return it to not notify the client twice
        if (dbMovimentation) {
          return null
        }

        const newMovimentation =
          await this.movimentationService.createMovimentation({
            judiceId: createdAudiencia.judiceId,
            type:
              createdAudiencia.type === "audiencia" ? "AUDIENCIA" : "PERICIA",
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
        this.publicationsService.update(p.id, { ...p, hasBeenTreated: true }),
      ),
    )

    return created
  }
}
