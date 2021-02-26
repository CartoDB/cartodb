#!/bin/bash

set -aex

CARTO_POSTGRES_HOST=localhost
#CARTO_POSTGRES_HOST=postgresql
CARTO_POSTGRES_PORT=5432
CARTO_POSTGRES_DIRECT_PORT=5432
CARTO_POSTGRES_USERNAME=postgres
CARTO_POSTGRES_PASSWORD=
RAILS_ENV=test

# Avoids conflicts dropping DB & users
PARALLEL=true

# Show the previous database.yml contents as a reference:
cat /cartodb/config/database.yml
# Copy database.yml
cp /cartodb/config/database.ci.yml /cartodb/config/database.yml

# Init Builder
cd /cartodb
mkdir -p /cartodb/log && chmod -R 777 /cartodb/log
createdb -T template0 -O postgres -h $CARTO_POSTGRES_HOST -U $CARTO_POSTGRES_USERNAME -E UTF8 template_postgis || true
psql -h $CARTO_POSTGRES_HOST -U $CARTO_POSTGRES_USERNAME template_postgis -c 'CREATE EXTENSION IF NOT EXISTS postgis;CREATE EXTENSION IF NOT EXISTS postgis_topology;'

# Setup test databases
bundle exec rake parallel:drop --trace || true
bundle exec rake parallel:create --trace
bundle exec rake parallel:migrate --trace

bundle exec rake cartodb:db:create_publicuser --trace
# TODO: bundle exec rake cartodb:db:create_federated_server --trace

# Run parallel testsc

bundle exec rake parallel:spec['spec\/commands']
#bundle exec rake parallel:spec[$NUM_CPUS,'spec\/models\/carto']
#bundle exec rake parallel:spec['spec\/models\/carto']
# 1588 examples, 839 failures - Most due to the unicode error

# [OK] bundle exec rspec spec/commands

# [OK]
# bundle exec rspec \
#   spec/models/carto/user_spec.rb \
#   spec/models/carto/user_table_spec.rb \
#   spec/models/table_spec.rb

# [?]
# bundle exec rake parallel:spec['spec\/requests\/.*superadmin']
