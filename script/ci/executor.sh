#!/bin/bash

main() {
    port=$((6000 + $2))
    # Run the rspec
    ZEUSSOCK=".zeus$port.sock" bundle exec zeus rspec -J#$3 $1 >> $port.log 2>&1;

    # Give some feedback
    if [ $? -eq 0 ]; then
      echo "Finished: $1 Port: $port";
      echo "$1" >> parallel_tests/specsuccess.log;
    else
      echo "Finished (FAILED): $1 Port: $port";
      echo "$1" >> parallel_tests/specfailed.log;
    fi
}

# Init
main $1 $2 $3;
exit 0;
