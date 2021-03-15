#!/bin/bash

set -ax

RAILS_ENV=test
PARALLEL=true

./script/ci/run_tests_before.sh

bundle exec rake parallel:spec['spec\/lib']
tests_exit_code=$?

echo $tests_exit_code >> tmp/tests_exit_code
echo "Tests exit code: $tests_exit_code"

./script/ci/run_tests_after.sh
