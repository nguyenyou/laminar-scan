import { build } from 'bun'

const builds = [
  {
    entrypoints: ['./devtools/index.ts'],
    naming: 'devtools.js',
    format: 'iife' as const,
  },
  {
    entrypoints: ['./frontend-devtools/frontend-devtools.ts'],
    naming: 'frontend-devtools.js',
    format: 'esm' as const,
  },
]

for (const config of builds) {
  const result = await build({
    entrypoints: config.entrypoints,
    outdir: '.',
    naming: config.naming,
    format: config.format,
    minify: false,
    sourcemap: 'none',
  })

  if (!result.success) {
    console.error(`Build failed for ${config.naming}:`)
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  console.log(`Build successful: ${config.naming}`)
}