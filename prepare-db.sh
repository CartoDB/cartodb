#!/bin/bash
MOCHA_OPTIONS=skip_integration PARALLEL=true RAILS_ENV=test RAILS_DATABASE_FILE=$1 bundle exec rake cartodb:test:prepare

