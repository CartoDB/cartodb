#!/bin/bash

# this could be any runnable code or shell script, really

# Create a development user
sh /root/cartodb/script/create_dev_user &

bundle exec script/resque &
bundle exec thin start --threaded -p 3000 --threadpool-size 5 &
cd /root/CartoDB-SQL-API && node app.js &
cd /root/Windshaft-cartodb && node app.js &