#!/bin/bash

main() {
    port=$((6000 + $2))
    # Run the rspec
    ZEUSSOCK=".zeus$port.seq" bundle exec zeus rspec $1 >> $port.log 2>&1;
    #RAILS_ENV=test PARALLEL=true RAILS_DATABASE_FILE=database_${2}.yml REDIS_PORT=$port bundle exec rspec --require ./spec/rspec_configuration.rb $1 >> $port.log 2>&1;

    # Give some feedback
    if [ $? -eq 0 ]; then
      echo "Finished: $1 Port: $port";
      echo "$1" >> specsuccess.log;
    else
      echo "Finished (FAILED): $1 Port: $port";
      echo "$1" >> specfailed.log;
    fi
}

# Init
main $1 $2;
exit 0;
