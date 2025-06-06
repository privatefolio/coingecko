import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoinData, CoingeckoCoin, RawCoingeckoCoin, CoingeckoCoinMarketData } from "./interfaces"

// https://docs.coingecko.com/reference/coins-markets
const API_ENDPOINT = "coins/markets"
const API_KEY = process.env.COINGECKO_API_KEY
const PAGE_SIZE = 250 // max

const DESTINATION_DIR = `./${DATA_FOLDER}/coins`

async function getAllIds() {
  const params = new URLSearchParams({
    include_platform: "true",
  })

  // https://docs.coingecko.com/reference/coins-list
  const URL = `${COINGECKO_BASE_API}/coins/list?${params}`
  console.log("getAllIds URL:", URL);

  const response = await fetch(URL)
  const list: RawCoingeckoCoin[] = await response.json()
  list.sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))
  console.log(`Fetched ${list.length} coins from Coingecko`)
  return list
}

export async function sleep(interval: number) {
  return new Promise((resolve) => setTimeout(resolve, interval))
}

async function main() {
  if (!API_KEY) throw new Error("Env COINGECKO_API_KEY is required")

  const ids = await getAllIds()
  await sleep(2_000)

  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })

  const params = new URLSearchParams({
    order: "market_cap_desc",
    per_page: String(PAGE_SIZE),
    vs_currency: "usd",
    x_cg_demo_api_key: API_KEY,
  })

  let records: CoingeckoCoin[] = []
  let page = 1
  while (true) {
    const url = `${COINGECKO_BASE_API}/${API_ENDPOINT}?${params}&page=${page}`
    console.log(`Page ${page} fetching. URL: ${url}`)

    // Sleep to avoid hitting rate limits
    // As per DESIGN.md, coingecko rate limits are 30 requests per minute
    await sleep(2_000)

    const res = await fetch(url)
    const list = await res.json()

    if (list?.status?.error_message) {
      throw new Error(list.status.error_message)
    }

    console.log(`Page ${page} fetched. Records: ${list.length}`)
    const coins: CoingeckoCoin[] = (list as CoingeckoCoinMarketData[]).map((marketData) => ({
      id: marketData.id,
      image: marketData.image,
      name: marketData.name,
      symbol: marketData.symbol,
      platforms: ids.find((x) => x.id === marketData.id)?.platforms || {},
      market_cap_rank: marketData.market_cap_rank,
    }))

    records = records.concat(coins)

    if (list.length < PAGE_SIZE) {
      break
    }

    page += 1
  }

  records.sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))

  // Remove duplicates based on id 🤷
  const oldLength = records.length
  console.log(`Fetched ${records.length} records from Coingecko`)
  records = records.filter((x, index, self) => self.findIndex((t) => t.id === x.id) === index)
  console.log(`Removed ${oldLength - records.length} duplicates (based on id)`)

  records.sort((a, b) => (a.market_cap_rank ?? Infinity) - (b.market_cap_rank ?? Infinity))

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
