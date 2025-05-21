import type { EmailService } from "@/services/EmailService"
import type { RequestHandler } from "express"

export class EmailTestController {
  constructor(private emsailService: EmailService) {}

  show: RequestHandler = async (req, res) => {
    const temp = this.emsailService.renderReport({
      reportDay: new Date("2023-10-01"),
      generatedDatetime: new Date("2023-10-02T12:00:00"),
      processedMovimentationCount: 150,
      items: [
        { name: "Item 1", value: "Value 1" },
        { name: "Item 2", value: "Value 2" },
        { name: "Item 3", value: "Value 3" },
        { name: "Item 4", value: "Value 4" },
      ],
    })

    res.send(temp)
    return
  }
}
