import type { RequestHandler } from "express"

import type { TemplateService } from "@/services/TemplateService"

export class EmailTestController {
  constructor(private templateService: TemplateService) {}

  show: RequestHandler = async (req, res) => {
    const temp = this.templateService.renderReport({
      reportDate: new Date("2025-05-22"),
      generatedDatetime: new Date("2025-05-22T10:30:00Z"),
      processedMovimentationCount: 5,
      totalClients: 2,
      totalSuccessfullClients: 1,
      totalErrorClients: 1,
      clients: [
        {
          name: "João da Silva",
          phoneNumber: "(51) 99123-4433",
          movimentations: [
            {
              lawsuitCNJ: "0001234-56.2022.5.01.0001",
              type: "Andamento",
              date: new Date("2025-05-21"),
              notificationSent: true,
            },
            {
              lawsuitCNJ: "0001234-56.2022.5.01.0001",
              type: "Despacho",
              date: new Date("2025-05-20"),
              notificationSent: false,
              notificationError: "NO_PHONE_NUMBER",
            },
          ],
        },
        {
          name: "Maria Oliveira",
          phoneNumber: "(53) 99123-4433",
          movimentations: [
            {
              lawsuitCNJ: "0009876-54.2023.5.01.0002",
              type: "Sentença",
              date: new Date("2025-05-19"),
              notificationSent: false,
              notificationError: "PHONE_NOT_ON_WHATSAPP",
            },
            {
              lawsuitCNJ: "0009876-54.2023.5.01.0002",
              type: "Audiência",
              date: new Date("2025-05-18"),
              notificationSent: true,
            },
          ],
        },
      ],
    })

    res.send(temp)
    return
  }
}
