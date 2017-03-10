#!/bin/bash

# BACKEND PARALLEL
script/ci/generateSpecFull.sh || exit 1

# CLEANER
script/ci/cleaner.sh || exit 1

# WRAPPER
script/ci/wrapper.sh $1 || exit 1

# TESTS
time parallel -j $1 -a parallel_tests/specfull.txt 'script/ci/executor.sh {} {%} {#}' || exit 1

# SECOND TRY
script/ci/secondTry.sh || exit 1

# REPORTER
script/ci/reporter.sh || exit 1
