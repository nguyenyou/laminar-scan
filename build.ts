import * as esbuild from 'esbuild'

const result = await esbuild.build({
  entryPoints: ['./frontend-devtools-bootstrap.ts'],
  outfile: './frontend-devtools.js',
  bundle: true,
  format: 'iife',
  minify: false,
  sourcemap: false,
  target: 'es2022',
  // Use production builds of Lit (not development)
  conditions: ['browser', 'production'],
})

if (result.errors.length > 0) {
  console.error('Build failed')
  for (const error of result.errors) {
    console.error(error)
  }
  process.exit(1)
}

console.log('Build successful')