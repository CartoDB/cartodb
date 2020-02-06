#!/bin/bash

WORKERS=${1:-22}

# BACKEND PARALLEL
script/ci/generateSpecFull.sh || exit 1

# CLEANER
script/ci/cleaner.sh || exit 1

# WRAPPER
script/ci/wrapper.sh $WORKERS || exit 1

# TESTS
time parallel -j $WORKERS -a parallel_tests/specfull.txt 'script/ci/executor.sh {} {%} {#}' || exit 1

echo "*****************************************************************************************************"
TRASH_MESSAGES="Varnish purge error: \[Errno 111\] Connection refused\|_CDB_LinkGhostTables() called with username=\|terminating connection due to administrator command\|Error trying to connect to Invalidation Service to link Ghost Tables: No module named redis\|pg_restore:\|pg_dump:\|is already a member of\|Skipping Ghost Tables linking"
cat parallel_tests/6*.log | grep -v "$TRASH_MESSAGES"
echo "*****************************************************************************************************"

# SECOND TRY
#script/ci/secondTry.sh || exit 1

# REPORTER
script/ci/reporter.sh || exit 1
