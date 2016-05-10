# coding: utf-8

require File.expand_path('../boot', __FILE__)

require "action_controller/railtie"
require "sequel-rails/railtie"
require "action_mailer/railtie"

if defined?(Bundler)
  Bundler.require(:default, :assets, Rails.env)
end

# Require optional rails engines
# TODO reactivate in order to enable CartoDB plugins
# Dir["engines" + "/*/*.gemspec"].each do |gemspec_file|
#   gem_name = File.basename(gemspec_file, File.extname(gemspec_file))
#   puts "** Loading engine #{gem_name}"
#   require gem_name
# end

module CartoDB
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Custom directories with classes and modules you want to be autoloadable.
    # config.autoload_paths += %W(#{config.root}/extras)

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named.
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Activate observers that should always be running.
    # config.active_record.observers = :cacher, :garbage_collector, :forum_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # JavaScript files you want as :defaults (application.js is always included).
    # config.action_view.javascript_expansions[:defaults] = %w(jquery rails)

    # Configure the default encoding used in templates for Ruby 1.9.
    config.encoding = "utf-8"

    # Configure sensitive parameters which will be filtered from the log file.
    config.filter_parameters += [:password]
    ::Sequel.extension(:pagination)
    ::Sequel.extension(:connection_validator)

    # Enable the asset pipeline
    config.assets.enabled = false

    config.assets.paths << Rails.root.join('bower_components')

    # Default setting is [/\w+\.(?!js|css).+/, /application.(css|js)$/]
    config.assets.precompile = %w(
      config.js
      app.js
      cdb.js
      embed.js
      dashboard_deps.js
      dashboard.js
      dashboard_templates.js
      public_dashboard_deps.js
      public_dashboard.js
      data_library_deps.js
      data_library.js
      public_map.js
      public_map_deps.js
      editor.js
      editor3.js
      public_editor3.js
      account_templates.js
      account_deps.js
      account.js
      keys_templates.js
      keys_deps.js
      keys.js
      models.js
      organization_templates.js
      organization_deps.js
      organization.js
      table.js
      public_dashboard.js
      public_like.js
      cartod1b.js
      common.js
      old_common.js
      old_common_without_core.js
      templates.js
      templates_mustache.js
      specs.js
      sessions.js
      signup.js
      confirmation_templates.js
      confirmation.js
      new_public_table.js
      
      mobile_apps.js
      mobile_apps_templates.js
      mobile_apps_deps.js

      explore_deps.js
      explore.js

      user_feed_deps.js
      user_feed.js

      tipsy.js
      modernizr.js
      statsc.js

      deep_insights.css
      cdb.css
      cdb/themes/css/cartodb.css
      cdb/themes/css/cartodb.ie.css
      common.css
      old_common.css
      dashboard.css
      cartodb.css
      fonts_ie.css
      fonts.css
      front.css
      editor.css
      editor3.css
      public_editor3.css
      table.css
      leaflet.css
      map.css
      map/leaflet.ie.css
      keys.css
      organization.css
      password_protected.css
      public_dashboard.css
      public_map.css
      data_library.css
      public_table.css
      sessions.css
      cartod1b.css
      user_feed.css
      explore.css
      mobile_apps.css

      plugins/tipsy.css

      *.jpg
      *.ico
      *.gif
      *.png
      *.eot
      *.otf
      *.svg
      *.woff
      *.ttf
      *.swf
    )

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'

    frontend_assets_version = JSON::parse(File.read(Rails.root.join('package.json')))['version']
    config.action_controller.relative_url_root = "/assets/#{frontend_assets_version}"
  end
end

require 'csv'
require 'state_machine'
require 'cartodb/controller_flows/public/content'
require 'cartodb/controller_flows/public/datasets'
require 'cartodb/controller_flows/public/maps'
require 'cartodb/errors'
require 'cartodb/logger'
require 'cartodb/sql_parser'
require 'cartodb/connection_pool'
require 'cartodb/pagination'
require 'cartodb/mini_sequel'
require 'cartodb/central'
#require 'importer/lib/cartodb-importer'
require 'importer/lib/cartodb-migrator'
require 'varnish/lib/cartodb-varnish'
$pool = CartoDB::ConnectionPool.new
