#!/bin/bash

echo ">>> Fixing permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

echo ">>> Creating storage directories..."
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
    
echo ">>> Waiting for database..."
until php -r "new PDO('mysql:host=db;dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    echo "Database not ready, waiting 2s..."
    sleep 2
done

echo ">>> Clearing stale cache..."
rm -f /var/www/html/bootstrap/cache/packages.php
rm -f /var/www/html/bootstrap/cache/services.php
rm -f /var/www/html/bootstrap/cache/config.php

echo ">>> Running artisan commands..."
php artisan package:discover --ansi || true
if [ -n "${APP_KEY:-}" ] || grep -Eq '^APP_KEY=.+$' .env 2>/dev/null; then
    echo ">>> Preserving existing application key..."
else
    php artisan key:generate --force || true
fi
php artisan config:clear || true
php artisan config:cache || true
php artisan migrate --force || true
php artisan storage:link --force || true

echo ">>> Starting PHP-FPM..."
exec "$@"
