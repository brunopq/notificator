import type { ClientService } from "./ClientService"
import type { JudiceService } from "./JudiceService"

export class ClientJudiceService {
  constructor(
    private clientService: ClientService,
    private judiceService: JudiceService,
  ) {}

  async getOrCreateByJudiceId(id: number) {
    const dbClient = await this.clientService.getByJudiceId(id)

    if (dbClient) {
      return dbClient
    }

    const clientInfo = await this.judiceService.getClientByJudiceId(id)

    const phones = []

    if (clientInfo.celular) {
      phones.push(clientInfo.celular)
    }

    const createdClient = await this.clientService.createClient({
      judiceId: id,
      name: clientInfo.nome,
      cpf: clientInfo.cpf,
      phones,
    })

    return createdClient
  }
}
