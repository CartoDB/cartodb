require 'statsd'

begin
  Statsd.host = APP_CONFIG[:graphite]['host']
  Statsd.port = APP_CONFIG[:graphite]['port']
rescue => e
  Rails.logger.info "Ignoring statsd, because there were a error loading the config"
end
