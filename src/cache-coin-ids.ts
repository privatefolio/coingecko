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

  const records = list //.map((x, index) => ({ index, ...x }))

  records.sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()))

  await writeFile(
    `${destination}/all.json`,
    JSON.stringify(records, null, 2)
  )

  await writeFile(
    `${destination}/count`,
    list.length.toString()
  )

  console.log(`All records ${list.length} written to ${destination}/all.json`)

  console.log(`Writing links: symbols -> geckoId, asset platforms -> geckoId`)

  const groupedBySymbol = list.reduce((acc, record) => {
    const { symbol } = record
    if (!acc[symbol]) acc[symbol] = []
    acc[symbol].push(record)
    return acc
  }, {} as Record<string, CoingeckoCoin[]>)


  for (const coin of list) {
    // TODO allow `/` in contract address and symbol
    if (!coin.symbol || coin.symbol.includes('/')) continue

    // coin-id/s/:symbol
    // only allow  symbols that are valid: contain only letters and numbers and are less than 10 characters
    if(/^[a-zA-Z0-9]{1,10}$/.test(coin.symbol)) {
      let coingeckoId = coin.id
      const coins = groupedBySymbol[coin.symbol]
      if(coins.length > 1) {
        // prioritize symbols that are L1, or live on ethereum or have the shortest id
        const coinNoPlatform = coins.filter(x => !x.platforms || Object.keys(x.platforms).length === 0)
        if(coinNoPlatform.length === 1) {
          coingeckoId = coinNoPlatform[0].id
        } else {
          const coinsOnEth = coins.filter(x => x.platforms?.["ethereum"])
          if(coinsOnEth.length === 1) {
            coingeckoId = coinsOnEth[0].id
          } else {
            coingeckoId = coins.reduce((acc, x) => acc.length < x.id.length ? acc : x.id, coins[0].id)
          }
        }
      }
      await writeFile(`${symbolsDestination}/${coin.symbol}`, coingeckoId)
    }

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
