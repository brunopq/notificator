import type { RequestHandler } from "express"

import { BadRequestError } from "@/common/errors/HTTPError"
import LawsuitService from "@/services/LawsuitService"

class LawsuitController {
  private lawsuitService: typeof LawsuitService

  constructor(lawsuitService: typeof LawsuitService) {
    this.lawsuitService = lawsuitService
  }

  index: RequestHandler = async (req, res) => {
    const lawsuits = await this.lawsuitService.listLawsuits()
    res.json(lawsuits)
  }

  show: RequestHandler = async (req, res) => {
    const cnj = req.params.cnj

    if (!cnj) {
      throw new BadRequestError("CNJ is required")
    }

    const lawsuit = await this.lawsuitService.getByCNJ(cnj)

    if (!lawsuit) {
      throw new BadRequestError("Lawsuit not found")
    }

    res.json(lawsuit)
  }

  create: RequestHandler = async (req, res) => {
    const lawsuit = await this.lawsuitService.create(req.body)
    res.status(201).json(lawsuit)
  }
}

export default new LawsuitController(LawsuitService)
