if Cartodb.config[:redis].blank?
  raise <<-MESSAGE
Please, configure Redis in your config/app_config.yml file like this:
  development:
    ...
    redis:
      host: '127.0.0.1'
      port: 6379
MESSAGE
end

# Redis interfaces definition:
conf = Cartodb.config[:redis].symbolize_keys
redis_conf = conf.select { |k, v| [:host, :port, :timeout, :driver, :tcp_keepalive].include?(k) }

if ENV['REDIS_PORT']
  redis_conf[:port] = ENV['REDIS_PORT']
end

if redis_conf[:tcp_keepalive] and redis_conf[:tcp_keepalive].is_a? Hash
  redis_conf[:tcp_keepalive] = redis_conf[:tcp_keepalive].symbolize_keys
end
if redis_conf[:driver] and redis_conf[:driver].is_a? String
  redis_conf.merge! :driver => redis_conf[:driver].to_sym
end

default_databases = {
  tables_metadata:     0,
  api_credentials:     3,
  users_metadata:      5,
  redis_migrator_logs: 6
}

databases = if conf[:databases].blank?
  default_databases
else
  conf[:databases].symbolize_keys
end

$tables_metadata     = Redis.new(redis_conf.merge(db: databases[:tables_metadata]))
$api_credentials     = Redis.new(redis_conf.merge(db: databases[:api_credentials]))
$users_metadata      = Redis.new(redis_conf.merge(db: databases[:users_metadata]))
$redis_migrator_logs = Redis.new(redis_conf.merge(db: databases[:redis_migrator_logs]))
$geocoder_metrics    = Redis.new(redis_conf.merge(db: databases[:users_metadata]))

# When in the "test" environment we don't expect a Redis
# server to be up and running at this point. Later code
# will take care of starting one (see spec/spec_helper.rb)
unless Rails.env.test?
  begin
    $tables_metadata.ping
    $api_credentials.ping
    $users_metadata.ping
    $redis_migrator_logs.ping
    $geocoder_metrics.ping
  rescue => e
    raise "Error connecting to Redis databases: #{e}"
  end
end
