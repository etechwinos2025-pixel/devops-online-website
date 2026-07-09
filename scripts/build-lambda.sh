#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HANDLER="$ROOT/api/handler"
BUILD="$HANDLER/build"
OUT="$HANDLER/lambda.zip"

rm -rf "$BUILD" "$OUT"
mkdir -p "$BUILD"

pip3 install -r "$HANDLER/requirements.txt" -t "$BUILD" --quiet --upgrade
cp "$HANDLER/lambda_function.py" "$BUILD/"

cd "$BUILD"
zip -rq "$OUT" .
echo "Built $OUT"
