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


# Drop all user databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'cartodb_test_user_%'")
touch user_databases.log
echo $databases >> user_databases.log
touch user_databases_new.log
sed -e 's/\s\+/\n/g' user_databases.log > user_databases_new.log

while read -r line
do
  psql -U postgres -t -c "drop database \"$line\"" >> cleaner.log
done < user_databases_new.log 

rm user_databases.log
rm users_databases_new.log

# Drop all testing databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'cartodb_user_%'")
touch user_databases.log
echo $databases >> user_databases.log
touch user_databases_new.log
sed -e 's/\s\+/\n/g' user_databases.log > user_databases_new.log

while read -r line
do
  psql -U postgres -t -c "drop database \"$line\"" >> cleaner.log
done < user_databases_new.log 

# Cleanup
rm databases.log
rm databases_new.log
rm user_databases.log
rm users_databases_new.log

echo "# Cleaner finished" 
