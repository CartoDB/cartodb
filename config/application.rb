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
      app.js
      application.js
      cdb.js
      common_data.js
      new_dashboard_deps.js
      new_dashboard.js
      new_dashboard_templates.js
      new_public_dashboard_deps.js
      new_public_dashboard.js
      editor.js
      dashboard.js
      account_templates.js
      account_deps.js
      account.js
      new_keys_templates.js
      new_keys_deps.js
      new_keys.js
      keys.js
      login.js
      models.js
      organization.js
      new_organization_templates.js
      new_organization_deps.js
      new_organization.js
      modernizr.js statsc.js
      table.js
      public_dashboard.js
      public_table.js
      map_public.js
      public_like.js
      templates.js
      templates_mustache.js
      tipsy.js
      common.js
      jquery.tipsy.js
      specs.js
      sessions.js
      modernizr.js

      cdb.css
      cdb/themes/css/cartodb.css
      cdb/themes/css/cartodb.ie.css
      common.css
      new_common.css
      new_dashboard.css
      dashboard.css
      db.css
      cartodb.css
      fonts_ie.css
      front.css

      editor.css
      new_keys.css
      keys.css
      leaflet.css
      map.css
      map/leaflet.ie.css
      organization.css
      new_organization.css
      pages.css
      plugins/tipsy.css
      public.css
      password_protected.css
      public_dashboard.css
      new_public_dashboard.css
      public_table.css
      public_map.css
      public_ie.css
      specs.css
      table.css
      tables.css
      frontend

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
require 'cartodb_stats'
$pool = CartoDB::ConnectionPool.new
