#!/bin/bash
# Jesus Vazquez
# executor.sh: This scripts executes the rspec recieved by param and stores it in specsuccess.log or specfailed.log
# depending on the execution result.

lock() {
  touch config/$1.lock;
}

unlock() {
  rm config/$1;
}

# Return first database.yml free
database_file() {
  for databaseyml in $(ls config -1| grep -v 'lock' | grep database)
  do
    if [ ! -f config/$databaseyml.lock ]; then
 #     echo $databaseyml;
      break
    fi
  done
#  echo "Can't take a free database_n.yml file";
#  return 1;
}

main() {
    fecha=$(date)
    # Find a valid databaseyml for the execution
    database_file
    # Lock the database.yml
    lock $databaseyml;
    
    # Choose redis-server port 
    port=$(cat config/$databaseyml |  grep "carto_db_test_*" | sed 's/[^0-9]*//g')

    # Run the rspec
    # Some dirty logic here
    if [[ $1 == *"services/importer"* ]] || [[ $1 == *"services/platform-limits/spec/unit/"* ]] || [[ $1 == *"services/wms/spec/unit/wms_spec.rb"* ]] || [[ $1 == *"services/datasources"* ]] || [[ $1 == *"spec/models/overlay/collection_spec.rb"* ]]; then
      #MOCHA_OPTIONS=skip_integration PARALLEL=true RAILS_ENV=test RAILS_DATABASE_FILE=$databaseyml bundle exec rake cartodb:test:prepare >> $port.log 2>&1;
      RAILS_ENV=test PARALLEL=true RAILS_DATABASE_FILE=$databaseyml REDIS_PORT=$port bundle exec rspec $1 >> $port.log 2>&1;
    else
      #MOCHA_OPTIONS=skip_integration PARALLEL=true RAILS_ENV=test RAILS_DATABASE_FILE=$databaseyml bundle exec rake cartodb:test:prepare >> $port.log 2>&1;
      RAILS_ENV=test PARALLEL=true RAILS_DATABASE_FILE=$databaseyml REDIS_PORT=$port bundle exec rspec spec/rspec_configuration.rb $1 >> $port.log 2>&1;
    fi
    
    # Give some feedback
    if [ $? -eq 0 ]; then
      echo "Finished: $1 Port: $port";
      echo "$1 $port.log" >> specsuccess.log;
    else
      echo "Finished (FAILED): $1 Port: $port";
      echo "$1 $port.log" >> specfailed.log;
    fi
    # Unlock file
    unlock $databaseyml.lock;
}

# Init
main $1;

