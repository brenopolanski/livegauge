export default {
  '**/*.{js,ts,tsx,md,json}': () => ['bunx biome check --write --no-errors-on-unmatched'],
}
