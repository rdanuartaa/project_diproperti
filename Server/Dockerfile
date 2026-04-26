FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

RUN echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/docker-php-config.ini \
    && echo "max_input_time = 300" >> /usr/local/etc/php/conf.d/docker-php-config.ini \
    && echo "memory_limit = 512M" >> /usr/local/etc/php/conf.d/docker-php-config.ini

EXPOSE 9000
CMD ["php-fpm"]
