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

TRASH_MESSAGES="Varnish purge error: \[Errno 111\] Connection refused\|_CDB_LinkGhostTables() called with username=\|terminating connection due to administrator command\|Error trying to connect to Invalidation Service to link Ghost Tables: No module named redis\|pg_restore:\|pg_dump:\|is already a member of\|Skipping Ghost Tables linking"

## uncomment the following if you want to debug failures in parallel execution
## Print parallel logs if some of them failed
#if [ -s parallel_tests/specfailed.log ]; then
#    echo "*****************************************************************************************************"
#    echo "Logs of tests that ran in parallel"
#    echo "*****************************************************************************************************"
#    cat parallel_tests/6*.log | grep -v "$TRASH_MESSAGES"
#    echo "*****************************************************************************************************"
#fi

echo "Giving a second try to the next specs"
cat parallel_tests/specfailed.log

RAILS_ENV=test bundle exec rspec $specs > tmp_file 2>&1
RC=$?

cat tmp_file | grep -v "$TRASH_MESSAGES"

if [ $RC -eq 0 ]; then
  truncate -s 0 parallel_tests/specfailed.log # Here is where the hack takes place. If im the second try we dont have errors then we're OK
else
  exit 0; # The reporter script will output the failed specs
fi
