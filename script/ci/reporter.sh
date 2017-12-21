#!/bin/bash
# Jesus Vazquez
# reporter.sh: This script is the exit point for the tests execution. It reads from specfailed.log
# the amount of tests that have failed. If there are none it sends a success status but if there are
# 1 or more it sends a failure status to warn the developer

filename="parallel_tests/specfailed.log"

lines=$(cat $filename | wc -l)

if [ "$lines" -eq "0" ];
then
        echo "Tests were OK";
        # TODO
        # gsu "Backend tests were OK" "Backend" success
        exit 0; #OK
else
        while read line;
        do
                # For each error cat its log file
                logfile=$(echo $line | grep -o '[0-9][0-9][0-9][0-9].log')
                # cat $logfile;
                # Give feedback to github
                # spec=$(echo $line | sed 's/\s.*$//')
                # echo "GSU with spec $spec" TODO
                # gsu "$spec failed" "$spec" failure TODO

        done < $filename
        # TODO
        # gsu "Backend tests failed" "Backend" failure
        exit 1; # ERROR
fi
