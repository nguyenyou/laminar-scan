import { build } from 'bun'

const result = await build({
  entrypoints: ['./frontend-devtools/frontend-devtools.ts'],
  outdir: '.',
  naming: 'frontend-devtools.js',
  format: 'esm' as const,
  minify: false,
  sourcemap: 'none',
})

if (!result.success) {
  console.error(`Build failed`)
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

console.log(`Build successful`)