#!/bin/bash

# BACKEND PARALLEL
sh generateSpecFull.sh

# CLEANER
sh cleaner.sh

# WRAPPER
sh wrapper.sh $1

# TESTS
time parallel -j $1 --delay 0.1 -a specfull.txt './executor.sh'

# SECOND TRY
sh secondTry.sh

# REPORTER
sh reporter.sh
