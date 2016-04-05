#!/bin/bash
# Jesus Vazquez
# executor.sh: This scripts executes the rspec recieved by param and stores it in specsuccess.log or specfailed.log
# depending on the execution result.

lock() {
  touch config/$1.lock;
}

unlock() {
  rm config/$1 >> executor.log 2>&1;
}

# Return first database.yml free
redis_file() {
  for redisfile in $(ls config -1| grep -v 'lock' | grep redis)
  do
    if [ ! -f config/$redisfile.lock ]; then
 #     echo $redisfile;
      break
    fi
  done
}

main() {
    # (hack) Choose a redis port for the execution
    redis_file
    # Lock the redis file
    lock $redisfile;
    
    # Choose redis-server port 
    port=$(cat config/$redisfile)

    # Run the rspec
    # Some dirty logic here
    if [[ $1 == *"services/importer"* ]] || [[ $1 == *"services/platform-limits/spec/unit/"* ]] || [[ $1 == *"services/wms/spec/unit/wms_spec.rb"* ]] || [[ $1 == *"services/datasources"* ]] || [[ $1 == *"spec/models/overlay/collection_spec.rb"* ]]; then
      RAILS_ENV=test PARALLEL=true RAILS_DATABASE_FILE=database_${2}.yml REDIS_PORT=$port bundle exec rspec $1 >> $port.log 2>&1;
    else
      RAILS_ENV=test PARALLEL=true RAILS_DATABASE_FILE=database_${2}.yml REDIS_PORT=$port bundle exec rspec spec/rspec_configuration.rb $1 >> $port.log 2>&1;
    fi
    
    # Give some feedback
    if [ $? -eq 0 ]; then
      echo "Finished: $1 Port: $port";
      echo "$1" >> specsuccess.log;
    else
      echo "Finished (FAILED): $1 Port: $port";
      echo "$1" >> specfailed.log;
    fi
    # Unlock file
    unlock $redisfile.lock;
}

# Init
main $1 $2];
exit 0;
