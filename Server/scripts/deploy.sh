#!/usr/bin/env bash

set -Eeuo pipefail

SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SERVER_DIR"

echo ">>> Validating Docker Compose configuration..."
docker compose config --quiet

echo ">>> Building the latest backend image..."
docker compose build --pull app

echo ">>> Applying Docker Compose changes..."
docker compose up -d --remove-orphans

echo ">>> Applying database migrations and Laravel caches..."
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan optimize:clear
docker compose exec -T app php artisan config:cache
docker compose exec -T app php artisan view:cache

if command -v curl >/dev/null 2>&1; then
    healthcheck_url="${DEPLOY_HEALTHCHECK_URL:-http://127.0.0.1:8000/}"
    echo ">>> Waiting for health check: $healthcheck_url"

    for attempt in $(seq 1 12); do
        if curl --fail --silent --show-error --max-time 10 "$healthcheck_url" >/dev/null; then
            echo ">>> Health check passed."
            break
        fi

        if [ "$attempt" -eq 12 ]; then
            echo "Health check failed after $attempt attempts."
            exit 1
        fi

        sleep 5
    done
else
    echo ">>> curl is unavailable; skipping HTTP health check."
fi

docker compose ps
echo ">>> Server deployment completed."
