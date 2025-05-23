console.log("Starting application build...")

const res = await Bun.build({
  entrypoints: ["src/index.ts"],
  target: "bun",
  outdir: "dist",
})

if (res.success) {
  console.log("Bundle created!")
}

console.log("Copying migration files...")

const { exitCode } = await Bun.$`cp -r drizzle dist`.nothrow()

if (exitCode !== 0) {
  throw new Error("Copying the migrations folder to dist failed.")
}

console.log("Application built!")

export {}
