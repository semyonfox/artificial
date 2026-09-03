#!/usr/bin/env bash
set -euo pipefail

required_files=(
  Dockerfile
  package.json
  pnpm-lock.yaml
  pnpm-workspace.yaml
  src/main.js
)

for required_file in "${required_files[@]}"; do
  if [ ! -r "$required_file" ]; then
    echo "Missing deployment input: $required_file" >&2
    exit 1
  fi
done

node --input-type=commonjs - <<'NODE'
const manifest = require("./package.json");
for (const name of ["build", "check"]) {
  if (!manifest.scripts?.[name]) {
    throw new Error(`Missing required package script: ${name}`);
  }
}
NODE

grep -Fq 'COPY --from=build /app/dist/' Dockerfile
grep -Fq 'apk add --no-cache wget' Dockerfile
grep -Fq 'HEALTHCHECK' Dockerfile

echo "Deployment contract valid: ${#required_files[@]} inputs"
