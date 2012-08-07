require 'resque'
# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = "#{Cartodb.config[:redis]['host']}:#{Cartodb.config[:redis]['port']}"