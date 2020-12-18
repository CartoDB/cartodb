#!/bin/bash

set -e

DB_IP=${DB_IP:-localhost}
TIMEOUT_CONN=${TIMEOUT_CONN:-120}
MAX_RETRIES=${MAX_RETRIES:-10}
SLEEP_RETRY=$((TIMEOUT_CONN/MAX_RETRIES))
SLEEP_DEBUGING=${SLEEP_DEBUGING:-120}

cd /cartodb
mkdir -p log && chmod -R 777 log/

echo "Waiting for the database to be ready. Retrying every $SLEEP_RETRY seconds until it reaches a total of $MAX_RETRIES retries"
n=0
until [[ $n -eq $MAX_RETRIES ]]; do
  echo "Try $((n+1))..."
  pg_isready -U postgres -h "$DB_IP" && break
  n=$((n+1))
  sleep "$SLEEP_RETRY"
done

createdb -T template0 -O postgres -h "${DB_IP}" -U postgres -E UTF8 template_postgis || true
psql -h "${DB_IP}" -U postgres -d template_postgis -c 'CREATE EXTENSION IF NOT EXISTS postgis;CREATE EXTENSION IF NOT EXISTS postgis_topology;'
RAILS_ENV=test bundle exec rake cartodb:test:prepare

