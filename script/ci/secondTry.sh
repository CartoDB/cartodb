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
  echo ok > tests_exit_status
  exit 0;
else
  specs=$(cat parallel_tests/specfailed.log | sed ':a;N;$!ba;s/\n/ /g')
fi

TRASH_MESSAGES="Varnish purge error: \[Errno 111\] Connection refused\|_CDB_LinkGhostTables() called with username=\|terminating connection due to administrator command\|Error trying to connect to Invalidation Service to link Ghost Tables: No module named redis\|pg_restore:\|pg_dump:\|is already a member of\|Skipping Ghost Tables linking"

# save parallel logs tests to be uploaded later"
cat parallel_tests/*.log  > parallel_tests_logs


if [ "$failedSpecs" -gt "10" ];
then
  echo "ERROR: Too many failures for a second try. Giving up."
  echo "$failedSpecs failed tests > 10, see parallel_tests_logs and docker-compose logs" > tests_exit_status
else
  echo "*****************************************************************************************************"
  echo "Giving a second try to the next specs"
  echo "*****************************************************************************************************"
  cat parallel_tests/specfailed.log
  echo "*****************************************************************************************************"

  RAILS_ENV=test bundle exec rspec $specs > serial_tests_logs 2>&1
  RC=$?

  if [ $RC -eq 0 ]; then
    echo ok > tests_exit_status
  else
    echo "some tests failed after a second try, see serial_tests_logs" > tests_exit_status
  fi
fi
