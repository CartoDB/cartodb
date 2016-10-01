require 'resque'
require 'resque/failure/base'
require 'resque/failure/multiple'
require 'resque/failure/redis'
require_dependency 'redis_factory'

# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = RedisFactory.new_connection
