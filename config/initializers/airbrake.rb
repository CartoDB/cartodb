if Cartodb.config[:airbrake_api_key].present?
  Airbrake.configure do |config|
    config.api_key = Cartodb.config[:airbrake_api_key]
  end
end
