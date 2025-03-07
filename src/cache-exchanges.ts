import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoingeckoExchange } from "./interfaces"

// https://docs.coingecko.com/reference/exchanges
const API_ENDPOINT = "exchanges"
const PAGE_SIZE = 250

const DESTINATION_DIR = `./${DATA_FOLDER}/exchanges`

async function main() {
  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })
  
  const records: CoingeckoExchange[] = []
  
  let page = 1
  while (true) {
    const url = `${COINGECKO_BASE_API}/${API_ENDPOINT}?per_page=${PAGE_SIZE}&page=${page}`
    console.log(`Page ${page} fetching. URL: ${url}`)

    const res = await fetch(url)
    const list: CoingeckoExchange[] = await res.json()
    console.log(`Page ${page} fetched. Records: ${list.length}`)

    records.push(...list.map((x, index) => ({ index: index + (page - 1) * PAGE_SIZE, ...x })))

    if (list.length < PAGE_SIZE) {
      break
    }

    page += 1
  }

  await writeFile(
    `${destination}/all.json`,
    JSON.stringify(records, null, 2)
  )
  console.log(`All records written to ${destination}/all.json`)

  return "Success"
}

main().then(console.log).catch(console.error)
