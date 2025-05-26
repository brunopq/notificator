import type { RequestHandler } from "express"
import { inject } from "inversify"

import { BadRequestError, NotFoundError } from "@/common/errors/HTTPError"

import { ClientService } from "@/services/ClientService"

export class ClientController {
  constructor(@inject(ClientService) private clientService: ClientService) {}

  show: RequestHandler = async (req, res) => {
    const id = req.params.id

    if (!id) {
      throw new BadRequestError("ID is required")
    }

    const client = await this.clientService.getById(id)

    if (!client) {
      throw new NotFoundError("Client not found")
    }

    res.json(client)
  }
}
