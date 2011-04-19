if APP_CONFIG[:redis].blank?
  raise <<-MESSAGE
Please, configure Redis in your config/app_config.yml file as this:
  development:
    ...
    redis:
      host: '127.0.0.1'
      port: 6379
MESSAGE
end

$tables_metadata = Redis.new(:host => APP_CONFIG[:redis]['host'], :port => APP_CONFIG[:redis]['port'], :db => "tables_metadata")
$queries_log = Redis.new(:host => APP_CONFIG[:redis]['host'], :port => APP_CONFIG[:redis]['port'],     :db => "queries_log")
$threshold = Redis.new(:host => APP_CONFIG[:redis]['host'], :port => APP_CONFIG[:redis]['port'],       :db => "threshold")
$api_credentials = Redis.new(:host => APP_CONFIG[:redis]['host'], :port => APP_CONFIG[:redis]['port'], :db => "api_credentials")