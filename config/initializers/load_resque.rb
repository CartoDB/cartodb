require 'resque'
require 'resque/failure/base'
require 'resque/failure/multiple'
require 'resque/failure/redis'
require './lib/resque_failure_logger'
require_dependency 'redis_factory'

# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = RedisFactory.new_connection

Resque::Failure::Multiple.classes = [Resque::Failure::Redis, ResqueFailureLogger]
Resque::Failure.backend = Resque::Failure::Multiple

## Logging

Resque.logger.level = :info

logger_output = if Rails.env.production? || Rails.env.staging?
                  Carto::Conf.new.log_file_path('resque.log')
                else
                  logger_stdout = STDOUT.dup
                  logger_stdout.sync = Rails.env.development?
                  logger_stdout
                end

Resque.logger = Carto::Common::Logger.new(logger_output)
