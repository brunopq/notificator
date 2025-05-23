import dependencyManager from "@/dependencyManager"
import { NotificationService } from "@/services/NotificationService"
import type { SchedulerService } from "@/services/SchedulerService"
import type { EvolutionAPIService } from "@/services/WhatsappService"
import { NotifyByLawsuitCNJ } from "./NotifyByLawsuitCNJ"

const lawsuitJudiceService = dependencyManager.getLawsuitJudiceService()
const movimentationService = dependencyManager.getMovimentationService()
const movimentationJudiceService =
  dependencyManager.getMovimentationJudiceService()
const whatsappService: Partial<EvolutionAPIService> = {
  async sendMessage(phoneNumber, message) {
    console.log("Sending message", phoneNumber, message)
    return true
  },
}

const notificationService = new NotificationService(
  whatsappService as EvolutionAPIService,
  movimentationService,
  {} as SchedulerService,
)

const notifyByLawsuitCNJ = new NotifyByLawsuitCNJ(
  lawsuitJudiceService,
  movimentationJudiceService,
  movimentationService,
  notificationService,
)

await notifyByLawsuitCNJ.execute("0000281-52.2024.5.14.0081")

console.log("executed")
