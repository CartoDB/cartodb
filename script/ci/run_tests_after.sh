#!/bin/bash

set -aex

echo "============================================================"
echo "                       RSpec summary                        "
echo "============================================================"
cat tmp/spec_summary.log

exit $tests_exit_code
