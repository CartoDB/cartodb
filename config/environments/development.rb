# coding: UTF-8

CartoDB::Application.configure do
  # Settings specified here will take precedence over those in config/application.rb

  # ActiveSupport::Dependencies.autoload_paths << File::join( Rails.root, 'lib')
  # ActiveSupport::Dependencies.autoload_paths << File::join( Rails.root, 'lib/central')

  # The production environment is meant for finished, "live" apps.
  # Code is not reloaded between requests
  config.cache_classes = false

  # Full error reports are disabled and caching is turned on
  config.consider_all_requests_local       = true
  config.action_controller.perform_caching = false

  # Specifies the header that your server uses for sending files
  config.action_dispatch.x_sendfile_header = "X-Sendfile"

  # For nginx:
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect'

  # If you have no front-end server that supports something like X-Sendfile,
  # just comment this out and Rails will serve the files

  # See everything in the log (default is :info)
  config.log_level = :debug

  # Use a different logger for distributed setups
  # config.logger = SyslogLogger.new

  # Use a different cache store in production
  # config.cache_store = :mem_cache_store

  # Disable Rails's static asset server
  # In production, Apache or nginx will already do this
  config.serve_static_assets = true

  # Enable serving of images, stylesheets, and javascripts from an asset server
  # config.action_controller.asset_host = "http://assets.example.com"

  # Disable delivery errors, bad email addresses will be ignored
  # config.action_mailer.raise_delivery_errors = false
  # config.action_mailer.delivery_method = :smtp

  # Enable threaded mode (https://github.com/resque/resque/issues/611)
  # config.threadsafe!
  # In order to run supporting concurrent requests, uncomment next line and run with
  # `bundle exec thin start --threaded -p 3000 --threadpool-size 5`.
  # Check your `config/database.yml` has `pool: 50` or higher for `development`.
  # The condition excludes this from resque, since it won't work with it and it doesn't need it.
  config.threadsafe! unless $rails_rake_task

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation can not be found)
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners
  config.active_support.deprecation = :notify

  # Compress JavaScript and CSS
  config.assets.compress = true

  # Don't fallback to assets pipeline
  config.assets.compile = false
  config.assets.debug = true

  # Generate digests for assets URLs
  config.assets.digest = true

  config.assets.initialize_on_precompile = true

  config.action_controller.asset_host = Proc.new do
    Cartodb.asset_path
  end

  SslRequirement.disable_ssl_check = true
end
