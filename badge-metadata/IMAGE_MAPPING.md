# Badge Image Mapping

This file maps the local artwork filenames in
`/public/assets/badges/png` to the ERC-1155 badge IDs used by
`SkarbnikBadges`.

## Temporary hackathon fallback

Most metadata files currently point to a shared placeholder image:

- `ipfs://QmSkarbnikBadgeImagePlaceholder/generic-badge.jpg`

This lets us mint and demo immediately while final badge art is still
being produced. Keep badge IDs unchanged when swapping final images.

Exceptions (already mapped to specific filenames):
- `27` -> `level1.jpg`
- `28` -> `level2.jpg`
- `29` -> `level3.jpg`

## Chapter badge art (IDs 6-11)

- `6` -> `blockchainandwallet.jpg`
- `7` -> `stablecoinsandtokens.jpg`
- `8` -> `dex.jpg`
- `9` -> `yeildandstaking.jpg`
- `10` -> `Smartcontract.jpg`
- `11` -> `saftey.jpg`

## Per-quest NFTs (IDs 12-26)

One NFT is now awarded for each quest completion. IDs map to quest IDs:

- `12` -> `l1-blockchain`
- `13` -> `l1-wallet`
- `14` -> `l1-usdc`
- `15` -> `l1-transaction`
- `16` -> `l1-gas`
- `17` -> `l2-defi`
- `18` -> `l2-dex`
- `19` -> `l2-yield`
- `20` -> `l2-liquidity`
- `21` -> `l2-smart`
- `22` -> `l3-il`
- `23` -> `l3-rwa`
- `24` -> `l3-risk`
- `25` -> `l3-rug`
- `26` -> `l3-boss`

When final artwork arrives, keep these IDs stable and only swap each
metadata `image` URI.

## Level completion NFTs (IDs 27-29)

One NFT is awarded for completing all quests in a given level:

- `27` -> all level 1 quests completed -> `level1.jpg`
- `28` -> all level 2 quests completed -> `level2.jpg`
- `29` -> all level 3 quests completed -> `level3.jpg`

## Existing milestone badges (IDs 1-5)

- `1` -> First quest completed (`Początkujący Skarbnik`)
- `2` -> Level 2 reached (`Srebrny Skarbnik`)
- `3` -> Level 3 reached (`Złoty Skarbnik`)
- `4` -> Boss trial completed (`Próba Zdana`)
- `5` -> 7-day streak (`Strażnik Skarbu`)
