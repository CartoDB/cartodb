#!/bin/bash
# Jesus Vazquez
# secondTry
# This is a hack for those specs that failed in the parallel execution.
# Here we can check if they failed because they can't run in parallel
# or because the PR code is wrong

# Requisites
cp config/database.yml.sample config/database.yml

# Start
failedSpecs=$(cat parallel_tests/specfailed.log | wc -l)

if [ "$failedSpecs" -eq "0" ];
then
  exit 0;
else
  specs=$(cat parallel_tests/specfailed.log | sed ':a;N;$!ba;s/\n/ /g')
fi

echo "Giving a second try to the next specs"
cat parallel_tests/specfailed.log

RAILS_ENV=test bundle exec rspec $specs


if [ $? -eq 0 ]; then
  truncate -s 0 parallel_tests/specfailed.log # Here is where the hack takes place. If im the second try we dont have errors then we're OK
else
  exit 0; # The reporter script will output the failed specs
fi
