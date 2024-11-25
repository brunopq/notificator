import type { RequestHandler } from "express"

import LawsuitService from "@/services/LawsuitService"

class LawsuitController {
  private lawsuitService: typeof LawsuitService

  constructor(lawsuitService: typeof LawsuitService) {
    this.lawsuitService = lawsuitService
  }

  index: RequestHandler = async (req, res) => {
    const lawsuits = await this.lawsuitService.listLawsuits()
    return res.json(lawsuits)
  }

  show: RequestHandler = async (req, res) => {
    const cnj = req.params.cnj

    if (!cnj) {
      return res.status(400).json({ error: "CNJ is required" })
    }

    const lawsuit = await this.lawsuitService.getByCNJ(cnj)
    return res.json(lawsuit)
  }

  create: RequestHandler = async (req, res) => {
    const lawsuit = await this.lawsuitService.create(req.body)
    return res.status(201).json(lawsuit)
  }
}

export default new LawsuitController(LawsuitService)
