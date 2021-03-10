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
