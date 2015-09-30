#!/bin/bash
# Jesus Vazquez
# prepare-db.sh: This scripts drops and then create the database specified by param.
echo "# Preparing the databases"
MOCHA_OPTIONS=skip_integration PARALLEL=true RAILS_ENV=test RAILS_DATABASE_FILE=$1 bundle exec rake cartodb:test:prepare >> database-creation.log 2>&1;

