#!/bin/bash

# Drop all databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'carto_db_test_%'")
touch parallel_tests/databases.log
echo $databases >> parallel_tests/databases.log
touch parallel_tests/databases_new.log
sed -e 's/\s\+/\n/g' parallel_tests/databases.log > parallel_tests/databases_new.log

while read -r line
do
  [ -z "$line" ] && continue
  psql -U postgres -t -c "drop database $line" >> parallel_tests/cleaner.log
done < parallel_tests/databases_new.log


# Drop all user databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'cartodb_test_user_%'")
touch parallel_tests/user_databases.log
echo $databases >> parallel_tests/user_databases.log
touch parallel_tests/user_databases_new.log
sed -e 's/\s\+/\n/g' parallel_tests/user_databases.log > parallel_tests/user_databases_new.log

while read -r line
do
  [ -z "$line" ] && continue
  psql -U postgres -t -c "drop database \"$line\"" >> parallel_tests/cleaner.log
done < parallel_tests/user_databases_new.log

rm parallel_tests/user_databases.log
rm parallel_tests/users_databases_new.log

# Drop all testing databases
databases=$(psql -U postgres -t -c "select datname from pg_database where datname like 'cartodb_user_%'")
touch parallel_tests/user_databases.log
echo $databases >> parallel_tests/user_databases.log
touch parallel_tests/user_databases_new.log
sed -e 's/\s\+/\n/g' parallel_tests/user_databases.log > parallel_tests/user_databases_new.log

while read -r line
do
  [ -z "$line" ] && continue
  psql -U postgres -t -c "drop database \"$line\"" >> parallel_tests/cleaner.log
done < parallel_tests/user_databases_new.log

# Cleanup
rm -f parallel_tests/databases.log
rm -f parallel_tests/databases_new.log
rm -f parallel_tests/user_databases.log
rm -f parallel_tests/users_databases_new.log
rm -f .zeu*
rm -f /cartodb/tmp/pids/server.pid

echo "# Cleaner finished"
