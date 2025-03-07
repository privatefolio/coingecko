import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoingeckoAssetPlatform } from "./interfaces"

// https://docs.coingecko.com/reference/asset-platforms-list
const API_ENDPOINT = "asset_platforms"
const PAGE_SIZE = 1000

const DESTINATION_DIR = `./${DATA_FOLDER}/asset-platforms`

async function main() {
  let page = 1
  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })

  const records: CoingeckoAssetPlatform[] = []

  while (true) {
    const url = `${COINGECKO_BASE_API}/${API_ENDPOINT}?per_page=${PAGE_SIZE}&page=${page}`
    console.log(`Page ${page} fetching. URL: ${url}`)

    const res = await fetch(url)
    const list: CoingeckoAssetPlatform[] = await res.json()
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
