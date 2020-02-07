#!/bin/bash

mkdir -p log && chmod -R 777 log/
createdb -T template0 -O postgres -h localhost -U postgres -E UTF8 template_postgis || true
psql -h localhost -U postgres template_postgis -c 'CREATE EXTENSION IF NOT EXISTS postgis;CREATE EXTENSION IF NOT EXISTS postgis_topology;'
RAILS_ENV=development bundle exec rake db:drop || true
RAILS_ENV=test bundle exec rake cartodb:test:prepare
RAILS_ENV=development bundle exec rake db:create
RAILS_ENV=development bundle exec rake db:migrate

