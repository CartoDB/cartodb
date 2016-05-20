#!/bin/sh
# Jesus Vazquez
# wrapper.sh: This script creates as much database.yml configuration files as we specify by param. It also
# starts redis server on database.yml specified port.
rm config/database_*
rm config/redis_*
#sudo killall redis-server

# Start redis servers
port=6001
for i in $(seq 1 $1);
do
        # Start redis server
        if [ ! -d "/tmp/redis-$port" ]; then
                mkdir /tmp/redis-$port
        fi
        touch redis.conf.test
        truncate -s 0 redis.conf.test
        echo "bind 127.0.0.1" >> redis.conf.test
        echo "port $port" >> redis.conf.test
        echo "daemonize yes" >> redis.conf.test
        echo "pidfile /tmp/redis-test-$port.tmp" >> redis.conf.test
        echo "timeout 300" >> redis.conf.test
        echo "dbfilename redis_test.rdb" >> redis.conf.test
        echo "dir /tmp/redis-$port" >> redis.conf.test
        echo "loglevel debug" >> redis.conf.test
        echo "logfile /tmp/redis-$port/stdout" >> redis.conf.test
        cat redis.conf.test | redis-server  - 2>&1
        rm redis.conf.test
        touch config/redis_$port;
        echo $port >> config/redis_$port;
        sleep 0.5; # Let redis server start

        # Increase port
        port=$((port+1))
done;
if [ ! -d "/tmp/redis-6335" ]; then
        mkdir /tmp/redis-6335
fi

# Start default redis on port 6335
touch redis.conf.test
truncate -s 0 redis.conf.test
echo "bind 127.0.0.1" >> redis.conf.test
echo "port 6335" >> redis.conf.test
echo "daemonize yes" >> redis.conf.test
echo "pidfile /tmp/redis-test-6335.tmp" >> redis.conf.test
echo "timeout 300" >> redis.conf.test
echo "dbfilename redis_test.rdb" >> redis.conf.test
echo "dir /tmp/redis-6335" >> redis.conf.test
echo "loglevel debug" >> redis.conf.test
echo "logfile /tmp/redis-6335/stdout" >> redis.conf.test
cat redis.conf.test | redis-server  - 2>&1
rm redis.conf.test
# ps -eaf | grep -v "grep" | grep redis-server >> wrapper.log 2>&1

# Create databases

# Read database name
databaseName="carto_db_test"
dbAdmin="postgres"
specCount=$(cat specfull.txt | wc -l)
specCount=$((specCount+6000))
startPort=6001
# Iterate and create one database per spec
for j in $(seq $startPort $specCount)
do
    # Get database owner
    owner=$(psql -U $dbAdmin -t -c "select r.rolname from pg_database d, pg_roles r where d.datname='carto_db_test' and d.datdba = r.oid")
    newDatabase="${databaseName}_${j}";
    # Create the database with specific owner and template
    $(psql -U $dbAdmin -t -c "create database $newDatabase with owner $owner template $databaseName;") >> wrapper.log 2>&1
    # Create the database.yml file
    echo "# Creating database_$j.yml file" >> wrapper.log 2>&1
    sed -e s/carto_db_test/carto_db_test_$j/g config/database.yml.sample > config/database_$j.yml
done

touch specfailed.log
touch specsuccess.log
echo "# Wrapper finished"
