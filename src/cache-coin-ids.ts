import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import { COINGECKO_BASE_API, DATA_FOLDER } from "./settings"
import type { CoingeckoCoin } from "./interfaces"

// https://docs.coingecko.com/reference/coins-list
const API_ENDPOINT = "coins/list"

const DESTINATION_DIR = `./${DATA_FOLDER}/coin-id`

async function main() {
  const params = new URLSearchParams({
    include_platform: "true",
  })

  const URL = `${COINGECKO_BASE_API}/${API_ENDPOINT}?${params}`
  console.log("URL:", URL);

  const response = await fetch(URL)
  const list: CoingeckoCoin[] = await response.json()

  const destination = join(process.cwd(), DESTINATION_DIR)
  const symbolsDestination = `${destination}/s`
  const assetPlatformsDestination = `${destination}/a`

  await mkdir(destination, { recursive: true })
  await mkdir(symbolsDestination, { recursive: true })
  await mkdir(assetPlatformsDestination, { recursive: true })

  const records = list.map((x, index) => ({ index, ...x }))
  await writeFile(
    `${destination}/all.json`,
    JSON.stringify(records, null, 2)
  )
  console.log(`All records ${list.length} written to ${destination}/all.json`)

  console.log(`Writing links: symbols -> geckoId, asset platforms -> geckoId`)
  for (const coin of list) {
    // TODO allow `/` in contract address and symbol
    if (!coin.symbol || coin.symbol.includes('/')) continue

    // coin-id/s/:symbol
    await writeFile(`${symbolsDestination}/${coin.symbol}`, coin.id)

    // coin-id/a/:asset-platform-id/:contract-address
    for (const assetPlatformId in coin.platforms) {
      const contractAddress = coin.platforms[assetPlatformId]
      await mkdir(`${assetPlatformsDestination}/${assetPlatformId}`, { recursive: true })

      if (!contractAddress || contractAddress.includes('/')) continue
      await writeFile(`${assetPlatformsDestination}/${assetPlatformId}/${contractAddress}`, coin.id)
    }
  }

  return "Success"
}


main().then(console.log).catch(console.error)
