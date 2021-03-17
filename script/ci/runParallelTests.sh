#!/bin/bash

WORKERS=${1:-22}

syntax_errors=0
# check syntax of modified Ruby files before running tests
for i in $(git diff --name-only origin/master -- "*.rb" );
    do echo $i; ruby -c $i || ((syntax_errors=syntax_errors+1));
done
if [ $syntax_errors -gt 0 ]
then
    echo "Syntax Errors": $syntax_errors;
    exit 1;
fi

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
script/ci/secondTry.sh
