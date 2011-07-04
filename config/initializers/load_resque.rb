require 'resque'
# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = "#{APP_CONFIG[:redis]['host']}:#{APP_CONFIG[:redis]['port']}"