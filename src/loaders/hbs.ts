import { readFileSync } from "node:fs"
import type { LoadHook } from "node:module"
import { fileURLToPath } from "node:url"

const load: LoadHook = async (url, context, next) => {
  // read and load handlebards templates
  if (url.endsWith(".hbs")) {
    const content = readFileSync(fileURLToPath(url))

    const strContent = `\`${content}\``

    return {
      format: "module",
      source: `export default ${strContent}`,
      shortCircuit: true,
    }
  }

  const result = await next(url, context)

  // load the source if nodejs doesn't do it
  // related issue https://github.com/nodejs/node/issues/57327
  if (!result.source && context.format === "commonjs") {
    result.source = readFileSync(fileURLToPath(url))
  }

  return result
}

export { load }
