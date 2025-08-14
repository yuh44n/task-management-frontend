# ---------------------------
# Stage 1: Build Laravel App
# ---------------------------
FROM php:8.2-cli AS build

# Install system dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    curl \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    && docker-php-ext-install zip pdo_mysql

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for caching)
COPY composer.json composer.lock ./

# Install PHP dependencies (no dev packages for production)
RUN composer install --no-dev --optimize-autoloader

# Copy application code
COPY . .

# Set permissions
RUN chown -R www-data:www-data storage bootstrap/cache

# Cache Laravel config/routes/views
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# ---------------------------
# Stage 2: Runtime Container
# ---------------------------
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libzip-dev \
    && docker-php-ext-install zip pdo_mysql

# Copy built app from Stage 1
WORKDIR /var/www/html
COPY --from=build /var/www/html ./

# Expose port for Laravel
EXPOSE 8000

# Run migrations and start Laravel server
CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
