require_dependency 'redis_factory'

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

$tables_metadata     = RedisFactory.new_connection(db_id: :tables_metadata)
$tables_metadata_secondary = RedisFactory.new_connection(db_id: :tables_metadata, secondary: true)
$api_credentials     = RedisFactory.new_connection(db_id: :api_credentials)
$users_metadata      = RedisFactory.new_connection(db_id: :users_metadata)
$redis_migrator_logs = RedisFactory.new_connection(db_id: :redis_migrator_logs)
$geocoder_metrics    = RedisFactory.new_connection(db_id: :users_metadata)
$limits_metadata     = RedisFactory.new_connection(db_id: :limits_metadata)
$users_metadata_secondary = RedisFactory.new_connection(db_id: :users_metadata, secondary: true)

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
    $limits_metadata.ping
  rescue StandardError => e
    raise "Error connecting to Redis databases: #{e}"
  end
end
