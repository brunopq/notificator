import MovimentationService, {
  insertMovimentationSchema,
} from "@/services/MovimentationService"
import type { RequestHandler } from "express"

class MovimentationController {
  private movimentationService: typeof MovimentationService

  constructor(movimentationService: typeof MovimentationService) {
    this.movimentationService = movimentationService
  }

  index: RequestHandler = async (_req, res) => {
    const movimentations = await this.movimentationService.getMovimentations()

    return res.json(movimentations)
  }

  show: RequestHandler = async (req, res) => {
    const movimentationId = req.params.id

    if (!movimentationId) {
      return res.status(400).json({ message: "Movimentation ID is required" })
    }

    const movimentation =
      await this.movimentationService.getFullMovimentationById(movimentationId)

    return res.json(movimentation)
  }

  create: RequestHandler = async (req, res) => {
    const newMovimentation = req.body

    const parsedMovimentation =
      insertMovimentationSchema.safeParse(newMovimentation)

    if (!parsedMovimentation.success) {
      return res.status(400).json({
        message: "Invalid movimentation data",
        errors: parsedMovimentation.error.errors,
      })
    }

    const movimentation = await this.movimentationService.createMovimentation(
      parsedMovimentation.data,
    )

    return res.json(movimentation)
  }

  fetch: RequestHandler = async (_req, res) => {
    const movimentation =
      await this.movimentationService.fetchNewMovimentations()

    return res.json(movimentation)
  }
}

export default new MovimentationController(MovimentationService)
