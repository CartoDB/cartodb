if Cartodb.config[:airbrake_api_key].present?
  Airbrake.configure do |config|
    config.api_key = Cartodb.config[:airbrake_api_key]
    config.host = 'collect.airbrake.io'
  end
end
