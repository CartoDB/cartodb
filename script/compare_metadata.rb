#!/usr/bin/env ruby
# compare_metadata.rb: this is a Nagios check to ensure information on the
# metadata PostgreSQL database matches the one on Redis database.

require 'yaml'
require 'pg'
require 'redis'
require_dependency 'carto/configuration'

script_name = "script/compare_metadata.rb"
data = `ps aux | grep "#{script_name}"`
         .split("\n")
         .select { |item| item =~ /ruby #{script_name}/i  }
         .select { |item| (item =~ / #{Process.pid} /i).nil? }
if data.length > 0
  puts "compare_metadata script already running, exiting"
  exit 0
end

carto_conf = Carto::Conf.new
config = carto_conf.app_config
database = carto_conf.db_config


RAILS_ENV = ENV['RAILS_ENV'] || 'production'
DBNAME = ENV['DB_NAME'] || database[RAILS_ENV]['database']
DBUSER = ENV['DB_USER'] || database[RAILS_ENV]['username']
DBPASS = ENV['DB_PASS'] || database[RAILS_ENV]['password']
DBHOST = ENV['DB_HOST'] || database[RAILS_ENV]['host']
DBPORT = ENV['DB_PORT'] || database[RAILS_ENV]['port']

REDISPORT = ENV['REDIS_PORT'] || config[RAILS_ENV]['redis']['port'] 
REDISHOST = ENV['REDIS_HOST'] || config[RAILS_ENV]['redis']['host']

redis = Redis.new(host: REDISHOST, port: REDISPORT)
pg = PGconn.connect(user: DBUSER, dbname: DBNAME, port: DBPORT, host: DBHOST)

pg_users = {}
pg.query('SELECT * FROM users') do |result|
  result.each do |row|
    pg_users[row['username']] = row
  end
end

redis_users = {}
redis.select(5)
redis.keys('rails:users:*').each do |user|
  if user.split(":").count == 3 
    user_info = redis.hgetall user
    redis_users[user.split(':')[2]] = user_info
  end
end

redis_not_postgres = (redis_users.keys - pg_users.keys)
postgres_not_redis = (pg_users.keys - redis_users.keys)

COMPARE = [
  'database_host', 
  'database_name',
  ['api_key', 'map_key']
]

mismatched = ""
pg_users.each do |user_id, data|
  if redis_users[user_id] != nil
    COMPARE.each do |key_to_compare|
      if key_to_compare.is_a? String
        redis_key = key_to_compare; pg_key = key_to_compare
      elsif key_to_compare.is_a? Array
        pg_key, redis_key = key_to_compare
      end

      if data[pg_key] != redis_users[user_id][redis_key]
        mismatched << "\n#{user_id}: #{pg_key}"
        mismatched << "\n - PostgreSQL:\t#{data[pg_key]}"
        mismatched << "\n - Redis:\t#{redis_users[user_id][redis_key]}"
      end
    end
  end
end


if redis_not_postgres.size > 0
  puts "ERROR: #{redis_not_postgres.size} users in Redis, not on Postgres"
  p redis_not_postgres 
  exit 2
end

if postgres_not_redis.size > 0
  puts "ERROR: #{postgres_not_redis.size} users in Postgres, not on Redis:"
  p postgres_not_redis
  exit 2
end

if mismatched != ""
  puts "ERROR: Mismatched data between PostgreSQL and Redis"
  puts mismatched
  exit 2
end

puts "OK"
exit 0
