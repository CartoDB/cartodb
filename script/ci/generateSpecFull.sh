#!/bin/bash
# Jesus Vazquez

rm -r parallel_tests
mkdir parallel_tests

# This is a file that contains a list of specs in the order you want them executed
# A good way to obtain it is by taking the output of this script and sorting them based on time taken
# so that longest tests run first. You can do it with: `sort result.txt -k 2 -r | grep -o '[^ ]*rb'`
# This script will try to follow that order, but any unlisted tests will be put at the beginning
ORDERED_TESTS='script/ci/ordered_tests.txt'

cat Makefile | \
grep -v 'require ./spec/rspec_configuration.rb'| \
grep 'rb'| sed -e 's/^\s*//' -e '/^$/d' | sed '/^#/ d' | sed 's/\\//' | sed 's/\s.*$//' > parallel_tests/specfull.txt

# Sort the specfull
# 1. New tests (specfull - ordered)
grep -Fxv -f $ORDERED_TESTS parallel_tests/specfull.txt > parallel_tests/ordered.txt
# 2. Ordered tests, excluding deleted ones: (ordered & specfull)
grep -Fx -f parallel_tests/specfull.txt $ORDERED_TESTS >> parallel_tests/ordered.txt
# Overwrite
mv parallel_tests/ordered.txt parallel_tests/specfull.txt

echo "# Speclist has been created"
