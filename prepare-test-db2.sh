#!/bin/bash
# Jesus Vazquez
# 

# Read database name
databaseName="carto_db_test"
dbAdmin="postgres"
specList=$(cat specfull.txt | wc -l)

# Iterate and create one database per spec
for i in $(seq 6001 $specList)
do
    # Get database owner
    owner=$(psql -U $dbAdmin -t -c "select r.rolname from pg_database d, pg_roles r where d.datname='carto_db_test' and d.datdba = r.oid")
    newDatabase="${databaseName}_${i}";
    # Create the database with specific owner and template
    $(psql -U $dbAdmin -t -c "create database $newDatabase with owner $owner template $databaseName;")
done
