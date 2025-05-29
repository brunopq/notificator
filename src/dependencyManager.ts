import { Container } from "inversify"

import { db } from "./database"
import { EvolutionAPIService } from "./services/EvolutionAPIService"
import { createJudiceApiClient } from "./services/JudiceService/apiClient"

const container = new Container({ autobind: true, defaultScope: "Singleton" })

container.bind("database").toConstantValue(db)
container.bind("createJudiceApiClient").toConstantValue(createJudiceApiClient)
container.bind("IWhatsappService").to(EvolutionAPIService)

export default container
