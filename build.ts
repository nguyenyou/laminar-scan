import { build } from "bun";

const result = await build({
  entrypoints: ["./devtools/index.ts"],
  outdir: ".",
  naming: "devtools.js",
  format: "iife",
  minify: false,
  sourcemap: "none",
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build successful: devtools.js");

