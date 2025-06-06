import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoingeckoExchange, RawCoingeckoExchange } from "./interfaces"

// https://docs.coingecko.com/reference/exchanges
const API_ENDPOINT = "exchanges"
const PAGE_SIZE = 250

const DESTINATION_DIR = `./${DATA_FOLDER}/exchanges`

async function main() {
  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })

  let records: CoingeckoExchange[] = []

  let page = 1
  while (true) {
    const url = `${COINGECKO_BASE_API}/${API_ENDPOINT}?per_page=${PAGE_SIZE}&page=${page}`
    console.log(`Page ${page} fetching. URL: ${url}`)

    const res = await fetch(url)
    const list: RawCoingeckoExchange[] = await res.json()
    console.log(`Page ${page} fetched. Records: ${list.length}`)

    records.push(...list.map((x) => ({
      id: x.id,
      name: x.name,
      country: x.country ?? undefined,
      year_established: x.year_established ?? undefined,
      description: x.description ?? "",
      url: x.url,
      image: x.image,
      trust_score: x.trust_score ?? undefined,
      trust_score_rank: x.trust_score_rank ?? undefined,
    })))

    if (list.length < PAGE_SIZE) {
      break
    }

    page += 1
  }

  records.sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
  records.sort((a, b) => (a.trust_score_rank ?? Infinity) - (b.trust_score_rank ?? Infinity))

  // Remove duplicates based on id 🤷
  const oldLength = records.length
  console.log(`Fetched ${records.length} records from Coingecko`)
  records = records.filter((x, index, self) => self.findIndex((t) => t.id === x.id) === index)
  console.log(`Removed ${oldLength - records.length} duplicates (based on id)`)

  await writeFile(
    `${destination}/all.json`,
    JSON.stringify(records, null, 2)
  )

  await writeFile(
    `${destination}/count`,
    records.length.toString()
  )

  console.log(`All ${records.length} records written to ${destination}/all.json`)

  return "Success"
}

main().then(console.log).catch(console.error)
