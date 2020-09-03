require 'statsd'

begin
  Statsd.host = Cartodb.get_config(:graphite, 'host')
  Statsd.port = Cartodb.get_config(:graphite, 'port')
rescue StandardError => e
  Rails.logger.info "Ignoring statsd, because there were a error loading the config"
end
