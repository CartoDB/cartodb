#!/bin/bash

WORKERS=${1:-22}

# init builder
script/ci/init.sh || exit 1

# BACKEND PARALLEL
script/ci/generateSpecFull.sh || exit 1

# CLEANER
script/ci/cleaner.sh || exit 1

# WRAPPER
script/ci/wrapper.sh $WORKERS || exit 1

# TESTS
time parallel -j $WORKERS -a parallel_tests/specfull.txt 'script/ci/executor.sh {} {%} {#}' || exit 1

# SECOND TRY
script/ci/secondTry.sh || exit 1

# REPORTER
script/ci/reporter.sh || exit 1
