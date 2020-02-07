#!/bin/sh -x
rm config/database_*
threads=$1
databaseName="carto_db_test"
dbAdmin="postgres"
startPort=6000
lastPort=$((threads + $startPort))

# Iterate and create one database per spec
for i in $(seq $startPort $lastPort)
do
    newDatabase="${databaseName}_${i}"
    # Create the database with specific owner and template
    createdb -U $dbAdmin -O "postgres" -T "carto_db_test" $newDatabase
    # Create the database.yml file
    echo "# Creating database_$i.yml file" >> parallel_tests/wrapper.log 2>&1
    sed -e s/carto_db_test/carto_db_test_$i/g config/database.yml.sample > config/database_$i.yml
done

for i in $(seq $startPort $lastPort)
do
  # Start Zeus server
  TURBO=1 ZEUSSOCK=".zeus$i.sock" RAILS_DATABASE_FILE=database_$i.yml REDIS_PORT=$i bundle exec zeus start >/dev/null 2>/dev/null &
done

# Wait for a few seconds for Zeus servers to startup.
# A better way to do it would be to wait for all `.zeus*.sock` files to be created.
sleep 5

touch parallel_tests/specfailed.log
touch parallel_tests/specsuccess.log
echo "# Wrapper finished"
