require 'resque'
require 'resque/user_mailer_jobs'
require 'resque/queries_threshold_jobs'

redis_config = APP_CONFIG[:redis]

Resque.redis = "#{redis_config['host']}:#{redis_config['port']}"