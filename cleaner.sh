#!/bin/bash

# Kill redis
sudo killall redis-server
# Drop all databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'carto_db_test_%'")
touch databases.log
echo $databases >> databases.log
touch databases_new.log
sed -e 's/\s\+/\n/g' databases.log > databases_new.log

while read -r line
do
  psql -U postgres -t -c "drop database $line" >> cleaner.log
done < databases_new.log 

# Cleanup
rm databases.log
rm databases_new.log

echo "# Cleaner finished" 
