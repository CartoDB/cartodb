#!/bin/bash

##
# Usage and optional variables:
#
#   DEBUG: will prinnt extra debugging information
#   LOCAL_CI: will run certain extra steps useful for running in a non-fresh local environment
#   PARALLELIZATION_LEVEL: parallelization level. Will fallback to nº of CPU cores if undefined
#
# Sample invocation:
#
#   LOCAL_CI=true DEBUG=true PARALLELIZATION_LEVEL=4 ./script/ci/run_tests.sh

set -aex

if [ -v DEBUG ] && [ $DEBUG = 'true' ]; then
    echo 'Running with the following environment:'
    env
fi

## Configuration variables
CPU_CORES=$(nproc --all)
POSTGRES_ADMIN_USER=postgres
POSTGRES_HOST=localhost
RAILS_ENV=test
PARALLEL=true

if [ -v PARALLELIZATION_LEVEL ]; then
    # Prevent parallelization levels greater than CPU cores to avoid bottlenecks
    PARALLELIZATION_LEVEL=$(( $PARALLELIZATION_LEVEL > $CPU_CORES ? $CPU_CORES : $PARALLELIZATION_LEVEL ))
else
    PARALLELIZATION_LEVEL=$CPU_CORES
fi
echo "Parallelization level: ${PARALLELIZATION_LEVEL}"

cd /cartodb


## Setup configuration files
cp config/app_config.yml.sample config/app_config.yml
cp config/database.yml.sample config/database.yml
if [ -v DEBUG ] && [ $DEBUG = 'true' ]; then
    echo 'Final configuration for running the CI'
    cat config/app_config.yml
    cat config/database.yml
fi


## Create log directories
mkdir -p log && chmod -R 777 log/


## Setup database
createdb -T template0 -O $POSTGRES_ADMIN_USER -h $POSTGRES_HOST -U $POSTGRES_ADMIN_USER -E UTF8 template_postgis || true
psql -h $POSTGRES_HOST -U $POSTGRES_ADMIN_USER template_postgis -c 'CREATE EXTENSION IF NOT EXISTS postgis;CREATE EXTENSION IF NOT EXISTS postgis_topology;'
if [ -v LOCAL_CI ] && [ $LOCAL_CI = 'true' ]; then
    RAILS_ENV=test bundle exec rake parallel:drop[${PARALLELIZATION_LEVEL}] --trace || true
fi
RAILS_ENV=test bundle exec rake parallel:setup[${PARALLELIZATION_LEVEL}] --trace


## Run tests
set +e
RAILS_ENV=test bundle exec rake parallel:spec[${PARALLELIZATION_LEVEL},'spec\/commands']
tests_exit_code=$?
set -e

## Store & display exit code
echo $tests_exit_code > tmp/tests_exit_code
echo "Tests exit code: $tests_exit_code"


## Print aggregated RSpec report
echo "============================================================"
echo "                       RSpec report                         "
echo "============================================================"
cat tmp/spec_summary.log

exit $tests_exit_code
