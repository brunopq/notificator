import type { RequestHandler } from "express"

import { BadRequestError } from "@/common/errors/HTTPError"
import PublicationsService, {
  insertPublicationSchema,
} from "@/services/PublicationsService"

class PublicationController {
  private publicationsService: typeof PublicationsService

  constructor(publicationsService: typeof PublicationsService) {
    this.publicationsService = publicationsService
  }

  index: RequestHandler = async (_req, res) => {
    const publications = await this.publicationsService.listPublications()

    res.json(publications)
  }

  show: RequestHandler = async (req, res) => {
    const publicationId = req.params.id

    if (!publicationId) {
      throw new BadRequestError("Publication ID is required")
    }

    const publication = await this.publicationsService.getById(publicationId)

    res.json(publication)
  }

  fetch: RequestHandler = async (_req, res) => {
    const publications = await this.publicationsService.fetchPublications()

    res.json(publications)
  }

  fetchClosed: RequestHandler = async (_req, res) => {
    const closedPublications =
      await this.publicationsService.fetchClosedPublications()

    res.json(closedPublications)
  }

  create: RequestHandler = async (req, res) => {
    const parsedPublication = insertPublicationSchema.parse(req.body)

    const publication =
      await this.publicationsService.createPublication(parsedPublication)

    res.json(publication)
  }
}

export default new PublicationController(PublicationsService)
