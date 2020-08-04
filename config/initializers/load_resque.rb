require 'resque'
require 'resque/failure/base'
require 'resque/failure/multiple'
require 'resque/failure/redis'
require_dependency 'redis_factory'

# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = RedisFactory.new_connection

Resque::Failure::Multiple.classes = [Resque::Failure::Redis, CartoDB::Logger::RollbarLogger]
Resque::Failure.backend = Resque::Failure::Multiple

## Logging
logger_stdout = STDOUT.dup
logger_stdout.sync = Rails.env.development?

Resque.logger.level = :info
Resque.logger = Carto::Common::Logger.new(logger_stdout)
