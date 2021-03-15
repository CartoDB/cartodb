#!/bin/bash

set -e

RAILS_ENV=${RAILS_ENV:-development}
DB_IP=${DB_IP:-localhost}
TIMEOUT_CONN=${TIMEOUT_CONN:-120}
MAX_RETRIES=${MAX_RETRIES:-10}
SLEEP_RETRY=$((TIMEOUT_CONN/MAX_RETRIES))

echo "Waiting for the database to be ready. Retrying every $SLEEP_RETRY seconds until it reaches a total of $MAX_RETRIES retries"
n=0
until [[ $n -eq $MAX_RETRIES ]]; do
  echo "Try $((n+1))..."
  pg_isready -U postgres -h "$DB_IP" && break
  n=$((n+1))
  sleep "$SLEEP_RETRY"
done

if [[ $n -eq $MAX_RETRIES ]]; then
  echo "For an unknown reason the connection to the database cannot be established"
  exit 1
fi

function exec_rake() {
  echo "Running rake: $*"
  if ! RAILS_ENV=development RAILS_CONFIG_BASE_PATH=/cartodb bundle exec rake "$*" > /tmp/rake.log 2>&1; then
    cat /tmp/rake.log
    echo
    echo "^"
    echo "Rake failed: $*"
    exit 1
  fi
}

echo "Initializating DB..."
exec_rake db:create
exec_rake db:migrate
exec_rake cartodb:connectors:create_providers
