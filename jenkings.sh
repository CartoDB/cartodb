#!/bin/bash 
export DISPLAY=:99 
sudo /etc/init.d/xvfb start 
bundle install --without development staging production
cd ~/.jenkins/server/jobs/cartodb/workspace
/usr/bin/env RAILS_ENV=test bundle exec rake db:drop db:create db:migrate  
bundle exec rake
RESULT=$? 
sudo /etc/init.d/xvfb stop 
exit $RESULT
