# Load the ::Resque constant manually so Coverband installs the corresponding hooks
# https://github.com/danmayer/coverband/blob/v5.0.1/lib/coverband.rb#L114
require 'resque'
require 'coverband'

Coverband.configure do |config|
  config.store = Coverband::Adapters::RedisStore.new(Redis.new(url: ENV['COVERBAND_REDIS_URL']))
  config.logger = Rails.logger
  config.verbose = Rails.env.development?
  config.web_enable_clear = Rails.env.development?
  config.track_views = true
end
