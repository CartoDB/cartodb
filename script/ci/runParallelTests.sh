#!/bin/bash

set -aex

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
script/ci/init.sh

# BACKEND PARALLEL
# script/ci/generateSpecFull.sh

# CLEANER
script/ci/cleaner.sh

# Clean previous log files
find log/ -name 'test_worker_*.log' -delete

# WRAPPER
script/ci/wrapper.sh $WORKERS

# Generate list will all the spec files
touch tmp/spec_list.txt
# find . -name '*_spec.rb' > tmp/spec_list.txt
find spec/commands -name '*_spec.rb' > tmp/spec_list.txt

# Run each spec file in a worker
parallel -j $WORKERS 'RAILS_ENV=test PARALLEL=true bundle exec rspec' < tmp/spec_list.txt
