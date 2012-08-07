if Cartodb.config[:redis].blank?
  raise <<-MESSAGE
Please, configure Redis in your config/app_config.yml file as this:
  development:
    ...
    redis:
      host: '127.0.0.1'
      port: 6379
MESSAGE
end

$tables_metadata = Redis.new(:host => Cartodb.config[:redis]['host'], :port => Cartodb.config[:redis]['port'], :db => 0)
$threshold = Redis.new(:host => Cartodb.config[:redis]['host'], :port => Cartodb.config[:redis]['port'],       :db => 2)
$api_credentials = Redis.new(:host => Cartodb.config[:redis]['host'], :port => Cartodb.config[:redis]['port'], :db => 3)
$users_metadata = Redis.new(:host => Cartodb.config[:redis]['host'], :port => Cartodb.config[:redis]['port'], :db => 5)

# TO ACTIVATE when decided how to do it more efficiently without filling the Redis
# $queries_log = Redis.new(:host => Cartodb.config[:redis]['host'], :port => Cartodb.config[:redis]['port'],     :db => 1)