import { type databaseType, db } from "./database"

import { ClientJudiceService } from "./services/ClientJudiceService"
import { ClientService } from "./services/ClientService"
import { JudiceService, createJudiceApiClient } from "./services/JudiceService"
import { LawsuitJudiceService } from "./services/LawsuitJudiceService"
import { LawsuitService } from "./services/LawsuitService"
import { MovimentationJudiceService } from "./services/MovimentationJudiceService"
import { MovimentationService } from "./services/MovimentationService"
import { NotificationService } from "./services/NotificationService"
import { PublicationJudiceService } from "./services/PublicationJudiceService"
import { PublicationsService } from "./services/PublicationsService"
import { SchedulerService } from "./services/SchedulerService"
import { WhatsappService } from "./services/WhatsappService"

import { NotifyByLawsuitCNJ } from "./useCases/NotifyByLawsuitCNJ"

import { AgendaController } from "./controllers/AgendaController"
import { JudiceController } from "./controllers/JudiceController"
import { LawsuitController } from "./controllers/LawsuitController"
import { MovimentationController } from "./controllers/MovimentationController"
import { NotificationController } from "./controllers/NotificationController"
import { NotificationFetcherController } from "./controllers/NotificationFetcherController"
import { PublicationController } from "./controllers/PublicationController"

class DependencyManager {
  private schedulerService: SchedulerService
  private whatsappService: WhatsappService
  private judiceService: JudiceService
  private clientService: ClientService
  private lawsuitService: LawsuitService
  private publicationService: PublicationsService
  private movimentationService: MovimentationService
  private clientJudiceService: ClientJudiceService
  private lawsuitJudiceService: LawsuitJudiceService
  private publicationJudiceService: PublicationJudiceService
  private movimentationJudiceService: MovimentationJudiceService
  private notificationService: NotificationService

  private notifyByLawsuitCNJUseCase: NotifyByLawsuitCNJ

  private agendaController: AgendaController
  private judiceController: JudiceController
  private lawsuitController: LawsuitController
  private movimentationController: MovimentationController
  private notificationController: NotificationController
  private notificationFetcherController: NotificationFetcherController
  private publicationController: PublicationController

  constructor(private db: databaseType) {
    this.schedulerService = new SchedulerService()
    this.whatsappService = new WhatsappService()
    this.judiceService = new JudiceService(createJudiceApiClient)
    this.clientService = new ClientService(this.db)
    this.lawsuitService = new LawsuitService(this.db)
    this.publicationService = new PublicationsService(this.db)
    this.movimentationService = new MovimentationService(this.db)

    this.clientJudiceService = new ClientJudiceService(
      this.clientService,
      this.judiceService,
    )
    this.lawsuitJudiceService = new LawsuitJudiceService(
      this.lawsuitService,
      this.judiceService,
      this.clientJudiceService,
      this.movimentationService,
    )
    this.publicationJudiceService = new PublicationJudiceService(
      this.judiceService,
      this.publicationService,
      this.lawsuitJudiceService,
    )
    this.movimentationJudiceService = new MovimentationJudiceService(
      this.movimentationService,
      this.judiceService,
      this.publicationService,
      this.publicationJudiceService,
    )

    this.notificationService = new NotificationService(
      this.whatsappService,
      this.movimentationService,
      this.clientJudiceService,
      this.schedulerService,
    )

    this.notifyByLawsuitCNJUseCase = new NotifyByLawsuitCNJ(
      this.lawsuitJudiceService,
      this.movimentationJudiceService,
      this.movimentationService,
      this.notificationService,
    )

    this.agendaController = new AgendaController(
      this.judiceService,
      this.notifyByLawsuitCNJUseCase,
    )
    this.judiceController = new JudiceController(this.judiceService)
    this.lawsuitController = new LawsuitController(
      this.lawsuitService,
      this.lawsuitJudiceService,
    )
    this.movimentationController = new MovimentationController(
      this.movimentationService,
      this.movimentationJudiceService,
    )
    this.notificationController = new NotificationController(
      this.notificationService,
    )
    this.notificationFetcherController = new NotificationFetcherController(
      this.movimentationJudiceService,
      this.notificationService,
      this.publicationJudiceService,
    )
    this.publicationController = new PublicationController(
      this.publicationService,
      this.publicationJudiceService,
    )
  }

  getSchedulerService() {
    return this.schedulerService
  }

  getWhatsappService() {
    return this.whatsappService
  }

  getJudiceService() {
    return this.judiceService
  }

  getClientService() {
    return this.clientService
  }

  getLawsuitService() {
    return this.lawsuitService
  }

  getPublicationService() {
    return this.publicationService
  }

  getMovimentationService() {
    return this.movimentationService
  }

  getClientJudiceService() {
    return this.clientJudiceService
  }

  getLawsuitJudiceService() {
    return this.lawsuitJudiceService
  }

  getPublicationJudiceService() {
    return this.publicationJudiceService
  }

  getMovimentationJudiceService() {
    return this.movimentationJudiceService
  }

  getNotificationService() {
    return this.notificationService
  }

  getNotifyByLawsuitCNJUseCase() {
    return this.notifyByLawsuitCNJUseCase
  }

  getAgendaController() {
    return this.agendaController
  }

  getJudiceController() {
    return this.judiceController
  }

  getLawsuitController() {
    return this.lawsuitController
  }

  getMovimentationController() {
    return this.movimentationController
  }

  getNotificationController() {
    return this.notificationController
  }

  getNotificationFetcherController() {
    return this.notificationFetcherController
  }

  getPublicationController() {
    return this.publicationController
  }
}

export default new DependencyManager(db)
