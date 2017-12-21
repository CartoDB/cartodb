#!/bin/bash

main() {
    port=$((6000 + $2))
    # Run the rspec
    start=$SECONDS
    ZEUSSOCK=".zeus$port.sock" bundle exec zeus rspec -J#$3 $1 >> parallel_tests/$port.log 2>&1;
    exitCode=$?
    taken=$(($SECONDS - $start))
    formatted_time=$(date -u -d @$taken +'%-0M:%-0S')

    # Give some feedback
    if [ $exitCode -eq 0 ]; then
      echo "[$formatted_time] Finished: $1 Port: $port";
      echo "$1" >> parallel_tests/specsuccess.log;
    else
      echo "[$formatted_time] Finished (FAILED): $1 Port: $port";
      echo "$1" >> parallel_tests/specfailed.log;
    fi
}

# Init
main $1 $2 $3;
exit 0;
