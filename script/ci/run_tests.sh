#!/bin/bash

##
# Usage and optional variables:
#
#   DEBUG: will prinnt extra debugging information
#   LOCAL_CI: will run certain extra steps useful for running in a non-fresh local environment
#   PARALLEL_TEST_PROCESSORS: parallelization level. Will fallback to nº of CPU cores if undefined
#
# Sample invocation:
#
#   LOCAL_CI=true DEBUG=true PARALLEL_TEST_PROCESSORS=6 ./script/ci/run_tests.sh

set -aex

if [ -v DEBUG ] && [ $DEBUG = 'true' ]; then
    echo 'Running with the following environment:'
    env
fi

## Configuration variables
DEBUG=true
CPU_CORES=$(nproc --all)
POSTGRES_ADMIN_USER=postgres
POSTGRES_HOST=localhost
RAILS_ENV=test
RUNTIME_LOG_FILE=tmp/parallel_runtime_rspec.log

if [ -v PARALLEL_TEST_PROCESSORS ]; then
    # Prevent parallelization levels greater than CPU cores to avoid bottlenecks
    PARALLEL_TEST_PROCESSORS=$(( $PARALLEL_TEST_PROCESSORS > $CPU_CORES ? $CPU_CORES : $PARALLEL_TEST_PROCESSORS ))
else
    PARALLEL_TEST_PROCESSORS=$CPU_CORES
fi
echo "Parallelization level: ${PARALLEL_TEST_PROCESSORS}"

cd /cartodb


## Setup configuration files
cp config/app_config.yml.sample config/app_config.yml
cp config/database.ci.yml config/database.yml
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
    bundle exec rake parallel:drop --trace || true
fi
bundle exec rake parallel:setup --trace


## Run tests
set +e
RSPEC_PATTERN=" \
spec\/commands|\
spec\/lib\/tasks|\
spec\/requests\/api|\
spec\/models\/carto|\
spec\/queries
"

if [ -v DEBUG ] && [ $DEBUG = 'true' ]; then
    bundle exec parallel_rspec spec/ --pattern ${RSPEC_PATTERN} --allowed-missing 100 --verbose --verbose-rerun-command
else
    bundle exec parallel_rspec spec/ --pattern ${RSPEC_PATTERN} --allowed-missing 100
fi
tests_exit_code=$?
set -e

## Store & display exit code
echo $tests_exit_code > tmp/tests_exit_code
echo "Tests exit code: $tests_exit_code"


## Print aggregated RSpec report
set +x
echo "============================================================"
echo "                       RSpec report                         "
echo "============================================================"
set -x
cat tmp/spec_summary.log

exit $tests_exit_code
