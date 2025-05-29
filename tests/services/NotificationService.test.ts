import assert from "node:assert/strict"
import { before, describe, it } from "node:test"
import { Container } from "inversify"
import sinon from "sinon"

import { MovimentationService } from "../../src/services/MovimentationService"
import { NotificationService } from "../../src/services/NotificationService.ts"
import { TemplateService } from "../../src/services/TemplateService"
import { dbMock } from "../db.mock.ts"

describe("Notification Service", () => {
  let notificationService: NotificationService
  let movimentationServiceMock: sinon.SinonStubbedInstance<MovimentationService>
  let templateServiceMock: sinon.SinonStubbedInstance<TemplateService>
  let db: sinon.SinonStubbedInstance<typeof dbMock>

  before(() => {
    const container = new Container({ autobind: true })

    // Mocks
    movimentationServiceMock = sinon.createStubInstance(MovimentationService)
    templateServiceMock = sinon.createStubInstance(TemplateService)
    db = sinon.stub(dbMock)

    container.bind("database").toConstantValue(db)
    container.bind("IWhatsappService").toConstantValue({})
    container
      .bind(MovimentationService)
      .toConstantValue(movimentationServiceMock)
    container.bind("SchedulerService").toConstantValue({})
    container.bind("createJudiceApiClient").toConstantValue({})
    container.bind(TemplateService).toConstantValue(templateServiceMock)
    container.bind(NotificationService).toSelf().inSingletonScope()

    notificationService = container.get(NotificationService)
  })

  it("should be defined", () => {
    assert.notEqual(notificationService, undefined)
  })

  it("should throw if movimentation is not found", async () => {
    movimentationServiceMock.getFullMovimentationById.resolves(undefined)
    await assert.rejects(
      () => notificationService.createInitialNotification("mov-id"),
      /Movimentation not found/,
    )
  })

  it("should create notification with remote audiencia template if link exists and type is AUDIENCIA", async () => {
    const fakeMov = {
      id: "mov-id",
      type: "AUDIENCIA",
      link: "https://link",
      finalDate: "2024-07-01T00:00:00.000Z",
      lawsuit: {
        client: { id: "client-id", name: "JOHN DOE" },
        cnj: "123456",
      },
    }
    movimentationServiceMock.getFullMovimentationById.resolves(fakeMov)
    templateServiceMock.renderRemoteAudiencia.returns("Rendered Message")

    db.insert.returns({
      values: sinon.stub().returns({
        returning: sinon.stub().resolves([{ id: "notif-id" }]),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any)

    const result = await notificationService.createInitialNotification("mov-id")
    assert.deepEqual(result, { id: "notif-id" })
    assert(templateServiceMock.renderRemoteAudiencia.calledOnce)
    assert(
      templateServiceMock.renderRemoteAudiencia.calledWithMatch({
        clientName: "John",
        CNJ: "123456",
        date: "2024-07-01T00:00:00.000Z",
        link: "https://link",
      }),
    )
  })

  it("should create notification with remote pericia template if link exists and type is not AUDIENCIA", async () => {
    const fakeMov = {
      id: "mov-id",
      type: "PERICIA",
      link: "https://link",
      finalDate: "2024-07-01T00:00:00.000Z",
      lawsuit: {
        client: { id: "client-id", name: "JANE DOE" },
        cnj: "654321",
      },
    }
    movimentationServiceMock.getFullMovimentationById.resolves(fakeMov)
    templateServiceMock.renderRemotePericia.returns("Rendered Message 2")

    db.insert.returns({
      values: sinon.stub().returns({
        returning: sinon.stub().resolves([{ id: "notif-id-2" }]),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any)

    const result = await notificationService.createInitialNotification("mov-id")
    assert.deepEqual(result, { id: "notif-id-2" })
    assert(templateServiceMock.renderRemotePericia.calledOnce)
    assert(
      templateServiceMock.renderRemotePericia.calledWithMatch({
        clientName: "Jane",
        CNJ: "654321",
        date: "2024-07-01T00:00:00.000Z",
        link: "https://link",
      }),
    )
  })

  it("should create notification with audiencia template if no link and type is AUDIENCIA", async () => {
    const fakeMov = {
      id: "mov-id",
      type: "AUDIENCIA",
      link: null,
      finalDate: "2024-07-01T00:00:00.000Z",
      lawsuit: {
        client: { id: "client-id", name: "ALICE SMITH" },
        cnj: "111222",
      },
    }
    movimentationServiceMock.getFullMovimentationById.resolves(fakeMov)
    templateServiceMock.renderAudiencia.returns("Rendered Message 3")

    db.insert.returns({
      values: sinon.stub().returns({
        returning: sinon.stub().resolves([{ id: "notif-id-3" }]),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any)

    const result = await notificationService.createInitialNotification("mov-id")
    assert.deepEqual(result, { id: "notif-id-3" })
    assert(templateServiceMock.renderAudiencia.calledOnce)
    assert(
      templateServiceMock.renderAudiencia.calledWithMatch({
        clientName: "Alice",
        CNJ: "111222",
        date: "2024-07-01T00:00:00.000Z",
      }),
    )
  })

  it("should create notification with pericia template if no link and type is not AUDIENCIA", async () => {
    const fakeMov = {
      id: "mov-id",
      type: "PERICIA",
      link: null,
      finalDate: "2024-07-01T00:00:00.000Z",
      lawsuit: {
        client: { id: "client-id", name: "BOB BROWN" },
        cnj: "333444",
      },
    }
    movimentationServiceMock.getFullMovimentationById.resolves(fakeMov)
    templateServiceMock.renderPericia.returns("Rendered Message 4")

    db.insert.returns({
      values: sinon.stub().returns({
        returning: sinon.stub().resolves([{ id: "notif-id-4" }]),
      }),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } as any)

    const result = await notificationService.createInitialNotification("mov-id")
    assert.deepEqual(result, { id: "notif-id-4" })
    assert(templateServiceMock.renderPericia.calledOnce)
    assert(
      templateServiceMock.renderPericia.calledWithMatch({
        clientName: "Bob",
        CNJ: "333444",
        date: "2024-07-01T00:00:00.000Z",
      }),
    )
  })
})
