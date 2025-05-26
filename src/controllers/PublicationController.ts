import type { RequestHandler } from "express"
import { inject } from "inversify"

import { BadRequestError } from "@/common/errors/HTTPError"
import { paginationInputSchema } from "@/common/models/pagination"

import { PublicationJudiceService } from "@/services/PublicationJudiceService"
import {
  PublicationsService,
  insertPublicationSchema,
} from "@/services/PublicationsService"

export class PublicationController {
  constructor(
    @inject(PublicationsService)
    private publicationsService: PublicationsService,
    @inject(PublicationJudiceService)
    private publicationJudiceService: PublicationJudiceService,
  ) {}

  index: RequestHandler = async (req, res) => {
    const pagination = paginationInputSchema.parse(req.query)

    const publications =
      await this.publicationsService.listPublications(pagination)

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
    const publications = await this.publicationJudiceService.fetchPublications()

    res.json(publications)
  }

  fetchClosed: RequestHandler = async (_req, res) => {
    const closedPublications =
      await this.publicationJudiceService.fetchClosedPublications()

    res.json(closedPublications)
  }

  create: RequestHandler = async (req, res) => {
    const parsedPublication = insertPublicationSchema.parse(req.body)

    const publication =
      await this.publicationsService.createPublication(parsedPublication)

    res.json(publication)
  }
}
