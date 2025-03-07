import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoinData, CoingeckoCoinMarketData } from "./interfaces"

// https://docs.coingecko.com/reference/coins-markets
const API_ENDPOINT = "coins/markets"
const API_KEY = process.env.COINGECKO_API_KEY
const PAGE_SIZE = 250 // max

const DESTINATION_DIR = `./${DATA_FOLDER}/coin-data`

export async function sleep(interval: number) {
  return new Promise((resolve) => setTimeout(resolve, interval))
}

async function main() {
  if (!API_KEY) throw new Error("Env COINGECKO_API_KEY is required")

  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })

  const params = new URLSearchParams({
    order: "market_cap_desc",
    per_page: String(PAGE_SIZE),
    vs_currency: "usd",
    x_cg_demo_api_key: API_KEY,
  })

  let totalCoins = 0
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
    const coins: CoinData[] = (list as CoingeckoCoinMarketData[]).map(({ id, image, name, symbol }) => ({
      id,
      image,
      name,
      symbol,
    }))

    // TODO add asset platforms to the list
    for (const coin of coins) {
      await writeFile(
        `${destination}/${coin.id}`,
        JSON.stringify(coin, null, 2),
      )
    }
    totalCoins += coins.length

    if (list.length < PAGE_SIZE) {
      break
    }

    page += 1
  }

  console.log(`Coin data for ${totalCoins} records written to ${destination}`)

  return "Success"
}

main().then(console.log).catch(console.error)
