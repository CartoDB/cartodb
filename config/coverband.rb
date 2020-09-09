require 'coverband'

Coverband.configure do |config|
  config.store = Coverband::Adapters::RedisStore.new(Redis.new(url: ENV['COVERBAND_REDIS_URL']))
  config.logger = Rails.logger
  config.verbose = Rails.env.development?
  config.web_enable_clear = Rails.env.development?
  config.track_views = true
end
