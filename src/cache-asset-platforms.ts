import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoingeckoAssetPlatform, RawCoingeckoAssetPlatform } from "./interfaces"

// https://docs.coingecko.com/reference/asset-platforms-list
const API_ENDPOINT = "asset_platforms"
const PAGE_SIZE = 1000

const DESTINATION_DIR = `./${DATA_FOLDER}/asset-platforms`

async function main() {
  let page = 1
  const destination = join(process.cwd(), DESTINATION_DIR)
  await mkdir(destination, { recursive: true })

  let records: CoingeckoAssetPlatform[] = []

  while (true) {
    const url = `${COINGECKO_BASE_API}/${API_ENDPOINT}?per_page=${PAGE_SIZE}&page=${page}`
    console.log(`Page ${page} fetching. URL: ${url}`)

    const res = await fetch(url)
    const list: RawCoingeckoAssetPlatform[] = await res.json()
    console.log(`Page ${page} fetched. Records: ${list.length}`)

    records.push(...list.map((x) => ({
      id: x.id,
      chain_identifier: x.chain_identifier ?? undefined,
      name: x.name,
      native_coin_id: x.native_coin_id,
      image: x.image.large ?? undefined,
    })))

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
