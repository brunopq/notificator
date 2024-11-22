import { env } from "@/common/utils/envConfig"
import { app } from "@/server"

app.listen(env.PORT, () => {
  const { NODE_ENV, HOST, PORT } = env
  console.log(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`)
})
