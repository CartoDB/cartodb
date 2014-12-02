require 'statsd'

begin
  Statsd.host = Cartodb.config[:graphite]['host']
  Statsd.port = Cartodb.config[:graphite]['port']
  Resque::Metrics.backends.append Resque::Metrics::Backends::Statsd.new(Statsd)
rescue => e
  Rails.logger.info "Ignoring statsd, because there were a error loading the config"
end
