#!/bin/bash

# BACKEND PARALLEL
sh generateSpecFull.sh || exit 1

# CLEANER
sh cleaner.sh || exit 1

# WRAPPER
sh wrapper.sh $1 || exit 1

# TESTS
time parallel -j $1 -a specfull.txt ./executor.sh {} {%} || exit 1

# SECOND TRY
sh secondTry.sh || exit 1

# REPORTER
sh reporter.sh || exit 1
