#!/bin/bash
# Jesus Vazquez
# executor.sh

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
 #   echo "Starting at $fecha"
    # Find a valid databaseyml for the execution
    database_file
    # Lock the database.yml
    lock $databaseyml;
    
    # Choose redis-server port 
    port=$(cat config/$databaseyml |  grep "carto_db_test_*" | sed 's/[^0-9]*//g')

    # Run the rspec
  #  echo "RAILS_ENV=test RAILS_DATABASE_FILE=$databaseyml REDIS_PORT=$port bundle exec rspec spec/rspec_configuration.rb $1" 2>&1;
    RAILS_ENV=test RAILS_DATABASE_FILE=$databaseyml REDIS_PORT=$port bundle exec rspec spec/rspec_configuration.rb $1 >> $port.log 2>&1;
    # Missing something? 
    echo "Finished: $1 Port: $port";
    # Unlock file
    unlock $databaseyml.lock;
}

# Init
main $1;

