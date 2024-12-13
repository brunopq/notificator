import type { RequestHandler } from "express"
import { z } from "zod"

import {
  BadRequestError,
  HTTPError,
  InternalServerError,
} from "@/common/errors/HTTPError"

import JudiceService from "@/services/JudiceService"

class JudiceController {
  private judiceService: typeof JudiceService

  constructor(judiceService: typeof JudiceService) {
    this.judiceService = judiceService
  }

  logoff: RequestHandler = async (_req, res) => {
    await this.judiceService.logoff()
    res.json({ message: "Logged off" })
  }

  indexPublications: RequestHandler = async (_req, res) => {
    try {
      const publications = await this.judiceService.getPublications()
      res.json(publications)
    } catch (e) {
      console.log("Error on request indexPublications")
      console.log(e)
      throw new InternalServerError()
    }
  }

  showPublication: RequestHandler = async (req, res) => {
    try {
      const judiceId = z.coerce.number().safeParse(req.params.judiceId)

      if (!judiceId.success) {
        throw new BadRequestError("Publication judice id must be a number")
      }

      const publication = await this.judiceService.getPublicationByJudiceId(
        judiceId.data,
      )
      res.json(publication)
    } catch (e) {
      if (e instanceof HTTPError) {
        throw e
      }

      console.log("Error on request showPublication")
      console.log(e)

      throw new InternalServerError()
    }
  }

  showLawsuit: RequestHandler = async (req, res) => {
    try {
      const cnj = req.params.cnj
      const lawsuit = await this.judiceService.searchLawsuitByCNJ(cnj)
      res.json(lawsuit)
    } catch (e) {
      if (e instanceof HTTPError) {
        throw e
      }

      console.log("Error on request showLawsuit")
      console.log(e)

      throw new InternalServerError()
    }
  }

  showAudiencias: RequestHandler = async (req, res) => {
    try {
      const cnj = req.params.cnj
      const audiencias = await this.judiceService.getAudienciasByCNJ(cnj)
      res.json(audiencias)
    } catch (e) {
      if (e instanceof HTTPError) {
        throw e
      }

      console.log("Error on request showAudiencias")
      console.log(e)

      throw new InternalServerError()
    }
  }

  showAudiencia: RequestHandler = async (req, res) => {
    // TODO: could be intresting to have this
  }

  showClient: RequestHandler = async (req, res) => {
    try {
      const clientId = z.coerce.number().safeParse(req.params.judiceId)
      if (!clientId.success) {
        throw new BadRequestError("Client judice id must be a number")
      }
      const client = await this.judiceService.getClientByJudiceId(clientId.data)
      res.json(client)
    } catch (e) {
      if (e instanceof HTTPError) {
        throw e
      }

      console.log("Error on request showClient")
      console.log(e)

      throw new InternalServerError()
    }
  }
}

export default new JudiceController(JudiceService)
