import type { RequestHandler } from "express"
import { inject } from "inversify"

import { BadRequestError } from "@/common/errors/HTTPError"

import { paginationInputSchema } from "@/common/models/pagination"
import { MovimentationJudiceService } from "@/services/MovimentationJudiceService"
import {
  MovimentationService,
  insertMovimentationSchema,
} from "@/services/MovimentationService"

export class MovimentationController {
  constructor(
    @inject(MovimentationService)
    private movimentationService: MovimentationService,
    @inject(MovimentationJudiceService)
    private movimentationJudiceService: MovimentationJudiceService,
  ) {}

  index: RequestHandler = async (req, res) => {
    const pagination = paginationInputSchema.parse(req.query)

    const movimentations =
      await this.movimentationService.getMovimentations(pagination)

    res.json(movimentations)
  }

  show: RequestHandler = async (req, res) => {
    const movimentationId = req.params.id

    if (!movimentationId) {
      throw new BadRequestError("Movimentation ID is required")
    }

    const movimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    res.json(movimentation)
  }

  create: RequestHandler = async (req, res) => {
    const newMovimentation = req.body

    const parsedMovimentation =
      insertMovimentationSchema.parse(newMovimentation)

    const movimentation =
      await this.movimentationService.createMovimentation(parsedMovimentation)

    res.json(movimentation)
  }

  fetch: RequestHandler = async (_req, res) => {
    const movimentation =
      await this.movimentationJudiceService.fetchNewMovimentations()

    res.json(movimentation)
  }
}
