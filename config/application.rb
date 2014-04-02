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

    # Enable the asset pipeline
    config.assets.enabled = false

    # Default setting is [/\w+\.(?!js|css).+/, /application.(css|js)$/]
    config.assets.precompile = %w( dashboard.js application.js cdb.js common_data.js keys.js login.js models.js organization.js table.js table_public.js models.js templates.js templates_mustache.js respond.js tipsy.js)
    config.assets.precompile += %w( cdb.css common.css dashboard.css front.css keys.css leaflet.css map.css organization.css pages.css table.css embeds.css fonts_ie.css embeds/public_map.css )
    config.assets.precompile += %w( *.jpg *.ico *.gif *.png *.eot *.otf *.svg *.woff *.ttf *.swf )

    # Version of your assets, change this if you want to expire all your assets
    config.assets.version = '1.0'
  end
end

require 'csv'
require 'state_machine'
require 'cartodb/errors'
require 'cartodb/logger'
require 'cartodb/sql_parser'
require 'cartodb/connection_pool'
require 'cartodb/pagination'
require 'cartodb/mini_sequel'
#require 'importer/lib/cartodb-importer'
require 'importer/lib/cartodb-migrator'
require 'varnish/lib/cartodb-varnish'
require 'cartodb_stats'
$pool = CartoDB::ConnectionPool.new
