#!/bin/bash

rm config/database_*
sudo killall redis-server

port=6001
for i in $(seq 1 $1);
do
        # Create database_i.yml
        echo "# Creating database_$i.yml file"
        sed -e s/carto_db_test/carto_db_test_$port/g config/database.yml.sample > config/database_$i.yml

        # Start redis server
        if [ ! -d "/tmp/redis-$port" ]; then
                mkdir /tmp/redis-$port
        fi
        config="port $port \n
                daemonize yes \n
                pidfile /tmp/redis-test-$port.tmp\n
                timeout 300\n
                dbfilename redis_test.rdb\n
                dir /tmp/redis-$port\n
                loglevel debug\n
                logfile /tmp/redis-$port/stdout"
        echo $config | redis-server  - 2>&1

        # Increase port
        port=$((port+1))
done;
ps -eaf | grep -v "grep" | grep redis-server

