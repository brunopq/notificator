import { type databaseType, db } from "./database"

// SERVICES
import { ClientJudiceService } from "./services/ClientJudiceService"
import { ClientService } from "./services/ClientService"
import { EmailService } from "./services/EmailService"
import { ExecutionService } from "./services/ExecutionService"
import { JudiceService, createJudiceApiClient } from "./services/JudiceService"
import { LawsuitJudiceService } from "./services/LawsuitJudiceService"
import { LawsuitService } from "./services/LawsuitService"
import { MovimentationJudiceService } from "./services/MovimentationJudiceService"
import { MovimentationService } from "./services/MovimentationService"
import { NotificationService } from "./services/NotificationService"
import { WhatsappService as OfficialWhatsappService } from "./services/OfficialWhatsappService"
import { PublicationJudiceService } from "./services/PublicationJudiceService"
import { PublicationsService } from "./services/PublicationsService"
import { SchedulerService } from "./services/SchedulerService"
import { TemplateService } from "./services/TemplateService"
import { WhatsappService } from "./services/WhatsappService"

// USE CASES
import { NotifyByLawsuitCNJ } from "./useCases/NotifyByLawsuitCNJ"
import { SendNotificationsReportUseCase } from "./useCases/SendNotificationsReportUseCase"

// CONTROLLERS
import { AgendaController } from "./controllers/AgendaController"
import { ClientController } from "./controllers/ClientController"
import { EmailTestController } from "./controllers/EmailTestController"
import { ExecutionController } from "./controllers/ExecutionController"
import { JudiceController } from "./controllers/JudiceController"
import { LawsuitController } from "./controllers/LawsuitController"
import { MovimentationController } from "./controllers/MovimentationController"
import { NotificationController } from "./controllers/NotificationController"
import { NotificationFetcherController } from "./controllers/NotificationFetcherController"
import { PublicationController } from "./controllers/PublicationController"
import { ReportController } from "./controllers/ReportController"

class DependencyManager {
  // SERVICES
  private schedulerService: SchedulerService
  private whatsappService: WhatsappService
  private officialWhatsappService: OfficialWhatsappService
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
  private executionService: ExecutionService
  private emailService: EmailService
  private templateService: TemplateService

  // USE CASES
  private notifyByLawsuitCNJUseCase: NotifyByLawsuitCNJ
  private sendNotificationsReportUseCase: SendNotificationsReportUseCase

  // CONTROLLERS
  private agendaController: AgendaController
  private judiceController: JudiceController
  private lawsuitController: LawsuitController
  private movimentationController: MovimentationController
  private notificationController: NotificationController
  private notificationFetcherController: NotificationFetcherController
  private publicationController: PublicationController
  private executionController: ExecutionController
  private clientController: ClientController
  private emailTestController: EmailTestController
  private reportController: ReportController

  constructor(private db: databaseType) {
    // SERVICES
    this.schedulerService = new SchedulerService()
    this.whatsappService = new WhatsappService()
    this.officialWhatsappService = new OfficialWhatsappService()
    this.judiceService = new JudiceService(createJudiceApiClient)
    this.clientService = new ClientService(this.db)
    this.lawsuitService = new LawsuitService(this.db)
    this.publicationService = new PublicationsService(this.db)
    this.movimentationService = new MovimentationService(this.db)
    this.executionService = new ExecutionService(this.db)
    this.emailService = new EmailService()

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
      this.db,
      this.whatsappService,
      this.movimentationService,
      this.clientJudiceService,
      this.schedulerService,
    )

    this.templateService = new TemplateService()

    // USE CASES

    this.sendNotificationsReportUseCase = new SendNotificationsReportUseCase(
      this.db,
      this.emailService,
      this.templateService,
      this.executionService,
    )

    this.notifyByLawsuitCNJUseCase = new NotifyByLawsuitCNJ(
      this.lawsuitJudiceService,
      this.movimentationJudiceService,
      this.movimentationService,
      this.notificationService,
    )

    // CONTROLLERS

    this.executionController = new ExecutionController(this.executionService)
    this.agendaController = new AgendaController(
      this.judiceService,
      this.notifyByLawsuitCNJUseCase,
      this.executionService,
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
    this.clientController = new ClientController(this.clientService)
    this.emailTestController = new EmailTestController(this.templateService)
    this.reportController = new ReportController(
      this.sendNotificationsReportUseCase,
    )
  }

  // SERVICES
  getExecutionService() {
    return this.executionService
  }

  getSchedulerService() {
    return this.schedulerService
  }

  getWhatsappService() {
    return this.whatsappService
  }

  getOfficialWhatsappService() {
    return this.officialWhatsappService
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

  getEmailService() {
    return this.emailService
  }

  getTemplateService() {
    return this.templateService
  }

  // USE CASES

  getSendNotificationsReportUseCase() {
    return this.sendNotificationsReportUseCase
  }

  getNotifyByLawsuitCNJUseCase() {
    return this.notifyByLawsuitCNJUseCase
  }

  // CONTROLLERS

  getExecutionController() {
    return this.executionController
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
  getClientController() {
    return this.clientController
  }
  getEmailTestController() {
    return this.emailTestController
  }
  getReportController() {
    return this.reportController
  }
}

export default new DependencyManager(db)
