import fs from 'node:fs'

const OUTPUT = "./.vercel/output"
const STATIC = `${OUTPUT}/static`
const RECURSIVE = { recursive: true }

try {
  fs.mkdirSync(OUTPUT, RECURSIVE)
} catch(e) {
  if(e.code !== "EEXIST") {
    throw e
  }
}

fs.cpSync("./www", STATIC, RECURSIVE)
fs.cpSync("./client", `${STATIC}/client`, RECURSIVE)
fs.cpSync("./engine", `${STATIC}/engine`, RECURSIVE)
fs.cpSync("./assets", `${STATIC}/assets`, RECURSIVE)
fs.cpSync("./link", `${STATIC}/link`, RECURSIVE)

fs.cpSync("./vercel_config.json", `${OUTPUT}/config.json`)
