require File.expand_path('../boot', __FILE__)

require "action_controller/railtie"
require "action_mailer/railtie"
require "active_record/railtie"
require_relative '../lib/carto/configuration'
require_relative '../lib/carto/carto_gears_support'

if defined?(Bundler)
  Bundler.require(:default, :assets, Rails.env)
end

module CartoDB
  class Application < Rails::Application
    include Carto::Configuration

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
    # Filter out connector connection credentials. We'd rather filter just 'connector.connection',
    # but version 3.x of Rails doesn't support nested parameter filtering.
    config.filter_parameters += [:connection]

    ::Sequel.extension(:pagination)
    ::Sequel.extension(:connection_validator)

    # Enable the asset pipeline
    config.assets.enabled = false

    FileUtils.mkdir_p(log_dir_path) unless File.directory?(log_dir_path)

    config.paths['public'] = [public_uploads_path]

    config.assets.paths << Rails.root.join('bower_components')

    # Default setting is [/\w+\.(?!js|css).+/, /application.(css|js)$/]
    config.assets.precompile = %w(
      config.js
      app.js
      cdb.js
      carto_node.js
      embed.js
      header.js
      footer.js
      dashboard_templates.js
      dashboard_deps.js
      dashboard.js
      dashboard_templates_static.js
      dashboard_deps_static.js
      dashboard_static.js
      data_library_deps.js
      data_library.js
      public_map_templates.js
      public_map_deps.js
      public_map.js
      public_map_templates_static.js
      public_map_deps_static.js
      public_map_static.js
      show_templates_static.js
      show_deps_static.js
      show_static.js
      embed_map_static.js
      editor.js
      account_templates.js
      account_deps.js
      account_static.js
      account.js
      profile.js
      profile_templates.js
      keys_templates.js
      keys_deps.js
      keys.js
      models.js
      organization_templates.js
      organization_deps.js
      organization.js
      table.js
      public_dashboard_deps.js
      public_dashboard.js
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

      mobile_apps_templates.js
      mobile_apps.js

      explore_deps.js
      explore.js

      user_feed_deps.js
      user_feed.js
      user_feed_new.css
      api_keys_new.js
      public_dashboard.js
      public_table_new.js
      sessions.js
      confirmation.js
      organization.js
      lockout.js
      new_lockout.js
      maintenance.js

      tipsy.js
      modernizr.js
      statsc.js

      builder.js
      builder_embed.js
      dataset.js
      common.js
      common_vendor.js

      deep_insights.css
      deep_insights_new.css
      cdb.css
      cdb/themes/css/cartodb.css
      cdb/themes/css/cartodb.ie.css
      common.css
      common_new.css
      old_common.css
      dashboard.css
      cartodb.css
      front.css
      editor.css
      new_lockout.css
      new_dashboard.css
      maintenance.css

      common_editor3.css
      editor3.css
      builder_embed.css

      header.css
      footer.css
      table.css
      leaflet.css
      map.css
      map/leaflet.ie.css
      keys.css
      organization.css
      password_protected.css
      public_dashboard.css
      public_dashboard_new.css
      public_map.css
      public_map_new.css
      embed_map.css
      data_library.css
      public_table.css
      public_table_new.css
      sessions.css
      explore.css
      mobile_apps.css
      api_keys.css
      api_keys_new.css
      oauth.css

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

    config.action_controller.relative_url_root = "/assets"

    custom_app_views_paths.reverse.each do |custom_views_path|
      config.paths['app/views'].unshift(custom_views_path)
    end

    # Sequel stores dates in the databse in the local timezone, AR should do the same
    config.active_record.default_timezone = :local

    config.active_record.raise_in_transactional_callbacks = true

    # Put sequel db tasks into its own namespace
    config.sequel.load_database_tasks = :sequel
  end
end

require 'csv'
require 'state_machines-activerecord'
require 'cartodb/controller_flows/public/content'
require 'cartodb/controller_flows/public/datasets'
require 'cartodb/controller_flows/public/maps'
require 'cartodb/errors'
require 'cartodb/logger'
require 'cartodb/connection_pool'
require 'cartodb/pagination'
require 'cartodb/mini_sequel'
require 'cartodb/central'
# require 'importer/lib/cartodb-importer'
require 'importer/lib/cartodb-migrator'
require 'varnish/lib/cartodb-varnish'
$pool = CartoDB::ConnectionPool.new

Carto::CartoGearsSupport.new.gears.each do |gear|
  require gear.full_path.join('lib', gear.name)
end
