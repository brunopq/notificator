import type { RequestHandler } from "express"
import { inject } from "inversify"

import { BadRequestError, NotFoundError } from "@/common/errors/HTTPError"

import { paginationInputSchema } from "@/common/models/pagination"

import { LawsuitJudiceService } from "@/services/LawsuitJudiceService"
import { LawsuitService, insertLawsuitSchema } from "@/services/LawsuitService"

export class LawsuitController {
  constructor(
    @inject(LawsuitService) private lawsuitService: LawsuitService,
    @inject(LawsuitJudiceService)
    private lawsuitJudiceService: LawsuitJudiceService,
  ) {}

  index: RequestHandler = async (req, res) => {
    const pagination = paginationInputSchema.parse(req.query)

    const lawsuits = await this.lawsuitService.listLawsuits(pagination)
    res.json(lawsuits)
  }

  show: RequestHandler = async (req, res) => {
    const id = req.params.id

    if (!id) {
      throw new BadRequestError("ID is required")
    }

    const lawsuit = await this.lawsuitService.getById(id)

    if (!lawsuit) {
      throw new NotFoundError("Lawsuit not found")
    }

    res.json(lawsuit)
  }

  showByCnj: RequestHandler = async (req, res) => {
    const cnj = req.params.cnj

    if (!cnj) {
      throw new BadRequestError("CNJ is required")
    }

    const lawsuit = await this.lawsuitService.getByCNJ(cnj)

    if (!lawsuit) {
      throw new NotFoundError("Lawsuit not found")
    }

    res.json(lawsuit)
  }

  create: RequestHandler = async (req, res) => {
    const lawsuitData = insertLawsuitSchema.parse(req.body)

    const createdLawsuit = await this.lawsuitService.create(lawsuitData)

    res.status(201).json(createdLawsuit)
  }

  showJudiceId: RequestHandler = async (req, res) => {
    const judiceId = Number(req.params.judiceId)

    if (!judiceId) {
      throw new BadRequestError("Judice ID is required")
    }

    const lawsuit = await this.lawsuitService.getByJudiceId(judiceId)

    if (!lawsuit) {
      throw new NotFoundError("Lawsuit not found")
    }

    res.json(lawsuit)
  }

  fetchJudiceId: RequestHandler = async (req, res) => {
    const judiceId = Number(req.params.judiceId)

    if (!judiceId) {
      throw new BadRequestError("Judice ID is required")
    }

    const lawsuit =
      await this.lawsuitJudiceService.getOrCreateByJudiceId(judiceId)

    if (!lawsuit) {
      throw new NotFoundError("Lawsuit not found")
    }

    res.json(lawsuit)
  }
}
