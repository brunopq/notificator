import assert from "node:assert/strict"
import { before, describe, it } from "node:test"
import { Container } from "inversify"

import { JudiceService } from "../../src/services/JudiceService"
import { createJudiceApiClient } from "../../src/services/JudiceService/apiClient"

describe("Judice Service", () => {
  let container: Container
  let judiceService: JudiceService

  before(() => {
    container = new Container()
    container
      .bind("createJudiceApiClient")
      .toConstantValue(createJudiceApiClient)
    container.bind(JudiceService).toSelf().inSingletonScope()
    judiceService = container.get(JudiceService)
  })

  it("should be defined", () => {
    assert.notEqual(judiceService, undefined)
  })

  describe("getAudienciasByJudiceId()", () => {
    it("should throw for invalid id", () => {
      assert.rejects(() => judiceService.getAudienciasByJudiceId(-1))
    })

    it("should return an array for valid id", async () => {
      const validId = 562537

      const result = await judiceService.getAudienciasByJudiceId(validId)
      assert(Array.isArray(result))
      assert(result.length > 0)
    })

    it('should return an array with "link"', async (t) => {
      const validId = 562537

      const result = await judiceService.getAudienciasByJudiceId(validId)

      // this lawsuit has movimentations with link
      assert(Array.isArray(result))
      assert(result.length > 0)

      const hasLinkProperty = result.some(
        (item) => "link" in item && item.link !== undefined,
      )
      assert(hasLinkProperty, 'Items should have a "link" property')
    })
  })
})
