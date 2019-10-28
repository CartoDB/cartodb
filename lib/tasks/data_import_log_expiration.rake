namespace :dataimport do
  namespace :log do
    desc 'Set expiration of DataImport logs to 2 days'
    task :set_expiration => :environment do
      redis           = $redis_migrator_logs || Redis.new
      two_days_secs   = 3600 * 24 * 2
      block           = lambda { |key| redis.expire(key, two_days_secs) }

      redis.keys("*importer:log:*").each(&block)
      redis.keys("*importer:entry:*").each(&block)
    end # set_expiration
  end # log
end # dataimport

