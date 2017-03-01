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
    $(psql -U $dbAdmin -t -c "create database $newDatabase with owner $owner template $databaseName;") >> wrapper.log 2>&1
    # Create the database.yml file
    echo "# Creating database_$i.yml file" >> wrapper.log 2>&1
    sed -e s/carto_db_test/carto_db_test_$i/g config/database.yml.sample > config/database_$i.yml
done

sleep 5
for i in $(seq $startPort $lastPort)
do
  # Start Zeus server
  ZEUSSOCK=".zeus$i.sock" RAILS_DATABASE_FILE=database_$i.yml REDIS_PORT=$i bundle exec zeus start >/dev/null 2>/dev/null &
done

touch specfailed.log
touch specsuccess.log
echo "# Wrapper finished"
