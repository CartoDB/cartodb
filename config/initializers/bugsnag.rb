if Cartodb.config[:bugsnag_api_key].present?
  Bugsnag.configure do |config|
    config.api_key = Cartodb.config[:bugsnag_api_key]
  end
end
