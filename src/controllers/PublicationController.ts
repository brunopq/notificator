import type { RequestHandler } from "express"

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

    return res.json(publications)
  }

  show: RequestHandler = async (req, res) => {
    const publicationId = req.params.id

    if (!publicationId) {
      return res.status(400).json({ message: "Publication ID is required" })
    }

    const publication = await this.publicationsService.getById(publicationId)

    return res.json(publication)
  }

  fetch: RequestHandler = async (_req, res) => {
    const publications = await this.publicationsService.fetchPublications()

    return res.json(publications)
  }

  fetchClosed: RequestHandler = async (_req, res) => {
    const closedPublications =
      await this.publicationsService.fetchClosedPublications()

    return res.json(closedPublications)
  }

  create: RequestHandler = async (req, res) => {
    const parsedPublication = insertPublicationSchema.safeParse(req.body)

    if (!parsedPublication.success) {
      return res.status(400).json({
        message: "Invalid publication data",
        errors: parsedPublication.error.errors,
      })
    }

    const publication = await this.publicationsService.createPublication(
      parsedPublication.data,
    )

    return res.json(publication)
  }
}

export default new PublicationController(PublicationsService)
