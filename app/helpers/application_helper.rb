# coding: utf-8

module ApplicationHelper

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  def show_footer?
    (controller_name == 'tables' && action_name != 'show') ||
    (controller_name == 'client_applications') || (controller_name == 'users')
  end

  def in_my_tables?
    controller_name == 'tables' && action_name == 'index' && !params[:public]
  end

  def current_path
    request.path
  end

  def selected_if(condition)
    condition ? 'selected' : ''
  end

  def paginate(collection)
    return if collection.empty?
    if collection.is_a?(Hash)
      if collection[:page_count] > 1
        render(:partial => 'shared/paginate', :locals => {:collection => collection}).html_safe
      end
    else
      if collection.page_count > 1
        render(:partial => 'shared/paginate', :locals => {:collection => collection}).html_safe
      end
    end
  end

  def last_blog_posts
    # Data generated from Rake task in lib/tasks/blog.rake
    if File.file?(CartoDB::LAST_BLOG_POSTS_FILE_PATH)
      File.read(CartoDB::LAST_BLOG_POSTS_FILE_PATH).html_safe
    end
  end

  def account_url
    if Cartodb.config[:account_host]
      request.protocol + CartoDB.account_host + CartoDB.account_path + '/' + current_user.username
    end
  end

  def upgrade_url
    account_url + '/upgrade'
  end

  def frontend_config
    config = {
      tiler_protocol:      Cartodb.config[:tiler]["private"]["protocol"],
      tiler_port:          Cartodb.config[:tiler]["private"]["port"],
      tiler_domain:        Cartodb.config[:tiler]["private"]["domain"],
      sql_api_protocol:    Cartodb.config[:sql_api]["private"]["protocol"],
      sql_api_domain:      Cartodb.config[:sql_api]["private"]["domain"],
      sql_api_endpoint:    Cartodb.config[:sql_api]["private"]["endpoint"],
      sql_api_port:        Cartodb.config[:sql_api]["private"]["port"],
      user_name:           CartoDB.extract_subdomain(request),
      cartodb_com_hosted:  Cartodb.config[:cartodb_com_hosted],
      account_host:        Cartodb.config[:account_host],
      dropbox_api_key:     Cartodb.config[:dropbox_api_key],
      gdrive_api_key:      Cartodb.config[:gdrive]['api_key'],
      gdrive_app_id:       Cartodb.config[:gdrive]['app_id'],
      max_asset_file_size: Cartodb.config[:assets]["max_file_size"]
    }

    if Cartodb.config[:graphite_public].present?
      config[:statsd_host] = Cartodb.config[:graphite_public]['host']
      config[:statsd_port] = Cartodb.config[:graphite_public]['port']
    end

    if Cartodb.config[:cdn_url].present?
      config[:cdn_url] = {
        http:              Cartodb.config[:cdn_url].try("fetch", "http", nil),
        https:             Cartodb.config[:cdn_url].try("fetch", "https", nil)
      }
    end

    if Cartodb.config[:error_track].present?
      config[:error_track_url] = Cartodb.config[:error_track]["url"]
      config[:error_track_percent_users] = Cartodb.config[:error_track]["percent_users"]
    end

    config.to_json
  end

  def frontend_config_public
    config = {
      tiler_protocol:      Cartodb.config[:tiler]["public"]["protocol"],
      tiler_port:          Cartodb.config[:tiler]["public"]["port"],
      tiler_domain:        Cartodb.config[:tiler]["public"]["domain"],
      sql_api_protocol:    Cartodb.config[:sql_api]["public"]["protocol"],
      sql_api_domain:      Cartodb.config[:sql_api]["public"]["domain"],
      sql_api_endpoint:    Cartodb.config[:sql_api]["public"]["endpoint"],
      sql_api_port:        Cartodb.config[:sql_api]["public"]["port"],
      user_name:           CartoDB.extract_subdomain(request),
      cartodb_com_hosted:  Cartodb.config[:cartodb_com_hosted],
      account_host:        Cartodb.config[:account_host],
      max_asset_file_size: Cartodb.config[:assets]["max_file_size"]
    }

    if Cartodb.config[:graphite_public].present?
      config[:statsd_host] = Cartodb.config[:graphite_public]['host']
      config[:statsd_port] = Cartodb.config[:graphite_public]['port']
    end

    if Cartodb.config[:cdn_url].present?
      config[:cdn_url] = {
        http:              Cartodb.config[:cdn_url].try("fetch", "http", nil),
        https:             Cartodb.config[:cdn_url].try("fetch", "https", nil)
      }
    end

    if Cartodb.config[:error_track].present?
      config[:error_track_url] = Cartodb.config[:error_track]["url"]
      config[:error_track_percent_users] = Cartodb.config[:error_track]["percent_users"]
    end

    config.to_json
  end

  def stringified_member_type
    current_user.present? ? current_user.account_type.to_s.upcase : 'UNAUTHENTICATED'
  end

  def insert_google_analytics(track)
    if not Cartodb.config[:google_analytics].blank? and not Cartodb.config[:google_analytics][track].blank? and not Cartodb.config[:google_analytics]["domain"].blank?
      render(:partial => 'shared/analytics', :locals => {ua: Cartodb.config[:google_analytics][track], domain: Cartodb.config[:google_analytics]["domain"]})
    end
  end

  def insert_rollbar()
    if not Cartodb.config[:rollbar].blank? and not Cartodb.config[:rollbar]['token'].blank?
      render(:partial => 'shared/rollbar', :locals => { token: Cartodb.config[:rollbar]['token'] })
    end
  end

  ##
  # Checks that the precompile list contains this file or raises an error, in dev only
  # Note: You will need to move config.assets.precompile to application.rb from production.rb
  def javascript_include_tag *sources
    raise_on_asset_absence sources
    super *sources
  end

  def stylesheet_link_tag *sources
    raise_on_asset_absence sources
    super *sources
  end

  def raise_on_asset_absence *sources
    sources.flatten.each do |source|
      next if source == {:media => "all"}
      raise "Hey, #{source} is not in the precompile list. This will fall apart in production." unless Rails.application.config.assets.precompile.any? do |matcher|
        if matcher.is_a? Proc
          matcher.call(source)
        elsif matcher.is_a? Regexp
          matcher.match(source)
        else
          rx = /(\.css)|(\.js)/
          matcher.to_s.gsub(rx,'') == source.to_s.gsub(rx,'')
        end
      end
    end if Rails.env.development?
  end

  def form_error_for(attribute, errors)
    error_messages = errors[attribute].map{|e| e.humanize }.join('. ')
    content_tag :div, error_messages, :class => 'field_error' if error_messages.present?
  end

  def v1_vizjson_url(visualization)
    "/api/v1/viz/#{visualization.id}/viz"
  end #v1_vizjson_url

  def v2_vizjson_url(visualization)
    "/api/v2/viz/#{visualization.id}/viz"
  end #v2_vizjon_url

  # TODO reactivate in order to allow CartoDB plugins
  # to inject content into the CartoDB admin UI
  # def content_from_plugins_for(hook)
  #   ::CartoDB::Plugin.registered.map do |plugin|
  #     hook_name = "#{plugin.name.underscore}_#{hook}_hook"
  #     send(hook_name) if defined?(hook_name)
  #   end.join('').html_safe
  # end
end
