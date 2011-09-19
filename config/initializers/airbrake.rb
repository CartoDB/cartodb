if Rails.env.production? && APP_CONFIG[:airbrake_api_key].present?
  puts APP_CONFIG[:airbrake_api_key]
  Airbrake.configure do |config|
    config.api_key = APP_CONFIG[:airbrake_api_key]
  end
end
