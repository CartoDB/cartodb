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


# Redis interfaces definition:
redis_conf = Cartodb.config[:redis].select { |k, v| [:host, :port].include?(k) }

$tables_metadata = Redis.new(redis_conf.merge(:db => 0))
# TO ACTIVATE when decided how to do it more efficiently without filling the Redis
#$queries_log    = Redis.new(Cartodb.config[:redis].merge(:db => 1))
$threshold       = Redis.new(redis_conf.merge(:db => 2))
$api_credentials = Redis.new(redis_conf.merge(:db => 3))
$users_metadata  = Redis.new(redis_conf.merge(:db => 5))
$layers_metadata = Redis.new(redis_conf.merge(:db => 7))
