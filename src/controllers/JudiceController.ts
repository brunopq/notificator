import type { RequestHandler } from "express"

import JudiceService from "@/services/JudiceService"

class JudiceController {
  private judiceService: typeof JudiceService

  constructor(judiceService: typeof JudiceService) {
    this.judiceService = judiceService
  }

  indexPublications: RequestHandler = async (_req, res) => {
    const publications = await this.judiceService.getPublications()
    res.json(publications)
  }

  showPublication: RequestHandler = async (req, res) => {
    const judiceId = Number(req.params.judiceId)
    const publication =
      await this.judiceService.getPublicationByJudiceId(judiceId)
    res.json(publication)
  }

  showLawsuit: RequestHandler = async (req, res) => {
    const cnj = req.params.cnj
    const lawsuit = await this.judiceService.searchLawsuitByCNJ(cnj)
    res.json(lawsuit)
  }

  showAudiencias: RequestHandler = async (req, res) => {
    const cnj = req.params.cnj
    const audiencias = await this.judiceService.getAudienciasByCNJ(cnj)
    res.json(audiencias)
  }

  showAudiencia: RequestHandler = async (req, res) => {
    // TODO: could be intresting to have this
  }

  showClient: RequestHandler = async (req, res) => {
    const clientId = Number(req.params.judiceId)
    const client = await this.judiceService.getClientByJudiceId(clientId)
    res.json(client)
  }
}

export default new JudiceController(JudiceService)
