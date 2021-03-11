#!/bin/bash

set -aex

## Configuration variables
POSTGRES_ADMIN_USER=postgres
POSTGRES_HOST=localhost
##

cd /cartodb


## Setup initial configuration
echo 'Show the initial config in CI'
cat config/app_config.yml || true
cat config/database.yml || true

echo 'Copy configuration files'
cp config/app_config.yml.sample config/app_config.yml || true
cp config/database.yml.sample config/database.yml || true

echo 'Show the replaced config in CI'
cat config/app_config.yml || true
cat config/database.yml || true

## Create log directories
mkdir -p log && chmod -R 777 log/

## Setup PostGIS
createdb -T template0 -O $POSTGRES_ADMIN_USER -h $POSTGRES_HOST -U $POSTGRES_ADMIN_USER -E UTF8 template_postgis || true
psql -h $POSTGRES_HOST -U $POSTGRES_ADMIN_USER template_postgis -c 'CREATE EXTENSION IF NOT EXISTS postgis;CREATE EXTENSION IF NOT EXISTS postgis_topology;'
#REDIS_PORT=6335 RAILS_ENV=test bundle exec rake cartodb:test:prepare
