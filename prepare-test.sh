#!/bin/bash
MOCHA_OPTIONS=skip_integration RAILS_ENV=test RAILS_DATABASE_FILE=$1 bundle exec rake cartodb:test:prepare

