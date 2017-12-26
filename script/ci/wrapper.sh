#!/bin/sh
rm config/database_*
threads=$1
databaseName="carto_db_test"
dbAdmin="postgres"
lastPort=$((threads + 6000))
startPort=6001
# Iterate and create one database per spec
for i in $(seq $startPort $lastPort)
do
    # Get database owner
    owner=$(psql -U $dbAdmin -t -c "select r.rolname from pg_database d, pg_roles r where d.datname='carto_db_test' and d.datdba = r.oid")
    newDatabase="${databaseName}_${i}";
    # Create the database with specific owner and template
    $(psql -U $dbAdmin -t -c "create database $newDatabase with owner $owner template $databaseName;") >> parallel_tests/wrapper.log 2>&1
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
