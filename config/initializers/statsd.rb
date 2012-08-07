require 'statsd'

begin
  Statsd.host = Cartodb.config[:graphite]['host']
  Statsd.port = Cartodb.config[:graphite]['port']
rescue => e
  Rails.logger.info "Ignoring statsd, because there were a error loading the config"
end
