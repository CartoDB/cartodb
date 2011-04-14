require 'resque'
require 'resque/user_mailer_jobs'

redis_config = APP_CONFIG[:redis]

Resque.redis = "#{redis_config['host']}:#{redis_config['port']}"