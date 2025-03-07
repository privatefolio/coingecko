# Coingecko Cache

This repo contains a couple of scripts that cache the metadata of coins from coingecko.

Why do we need this? Because of rate limits and because we don't want people to have to setup their
own Coingecko API key.

## API

### Coingecko Id

This API lets you find the coingecko id of:

- a coin id by its symbol (ticker).
- a coin id by its asset platform id and contract address.

1. `GET /public/coin-id/s/:symbol`
2. `GET /public/coin-id/a/:asset-platform-id/:contract-address`

### Coingecko Metadata

This API lets you find the coingecko id of:

- a coin metadata (logo, symbol, name) by its coingecko id.

1. `GET /public/coin-data/:coin-id`

<!-- - a chain id by its chain id. -->
<!-- `GET /public/asset-platform-id/:chainId` -->

## Asset metadata API

We use these APIs to get asset metadata such as logo image, website url, asset description, etc.
Because of the stinginess of the free tier, this app makes use of a local cache.

| Provider  | Rate limit (free tier) | Normalized value    | Minimum call interval | Docs                                            |
| --------- | ---------------------- | ------------------- | --------------------- | ----------------------------------------------- |
| Coingecko | 30 calls per minute    | 30 calls per minute | 2000ms                | [link](https://docs.coingecko.com/reference/common-errors-rate-limit#rate-limit) |

## Getting started

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run cache:coin-ids
bun run cache:coin-data
bun run cache:asset-platforms
bun run cache:exchanges
```
