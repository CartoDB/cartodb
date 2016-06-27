# coding: utf-8
require_dependency 'cartodb_config_utils'

module ApplicationHelper
  include CartoDB::ConfigUtils

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

  def sql_api_template(privacy="private")
    sql_api_url('{user}', privacy)
  end

  def sql_api_url(username, privacy = 'private')
    sql_api = Cartodb.config[:sql_api][privacy]
    if CartoDB.subdomainless_urls?
      sql_api["protocol"] + "://" + sql_api["domain"] + ":" + sql_api["port"].to_s + "/user/#{username}"
    else
      sql_api["protocol"] + "://#{username}." + sql_api["domain"] + ":" + sql_api["port"].to_s
    end
  end

  def maps_api_template(privacy="private")
      maps_api = Cartodb.config[:tiler][privacy]
      if CartoDB.subdomainless_urls?
        maps_api["protocol"] + "://" + maps_api["domain"] + ":" + maps_api["port"].to_s + "/user/{user}"
      else
        maps_api["protocol"] + "://{user}." + maps_api["domain"] + ":" + maps_api["port"].to_s
      end
  end

  module_function :maps_api_template
  module_function :sql_api_template, :sql_api_url

  def frontend_config
    config = {
      maps_api_template:          maps_api_template,
      sql_api_template:           sql_api_template,
      user_name:                  CartoDB.extract_subdomain(request),
      cartodb_com_hosted:         Cartodb.config[:cartodb_com_hosted].present?,
      account_host:               CartoDB.account_host,
      dropbox_api_key:            Cartodb.get_config(:dropbox_api_key),
      gdrive_api_key:             Cartodb.get_config(:gdrive, 'api_key'),
      gdrive_app_id:              Cartodb.get_config(:gdrive, 'app_id'),
      oauth_dropbox:              Cartodb.get_config(:oauth, 'dropbox', 'app_key'),
      oauth_box:                  Cartodb.get_config(:oauth, 'box', 'client_id'),
      oauth_gdrive:               Cartodb.get_config(:oauth, 'gdrive', 'client_id'),
      oauth_instagram:            Cartodb.get_config(:oauth, 'instagram', 'app_key'),
      oauth_mailchimp:            Cartodb.get_config(:oauth, 'mailchimp', 'app_key'),
      datasource_search_twitter:  nil,
      max_asset_file_size:        Cartodb.config[:assets]["max_file_size"],
      watcher_ttl:                Cartodb.config[:watcher].try("fetch", 'ttl', 60),
      upgrade_url:                cartodb_com_hosted? ? false : "#{current_user.upgrade_url(request.protocol)}",
      licenses:                   Carto::License.all,
      data_library_enabled:       CartoDB::Visualization::CommonDataService.configured?
    }

    if Cartodb.config[:datasource_search].present? && Cartodb.config[:datasource_search]['twitter_search'].present? \
      && Cartodb.config[:datasource_search]['twitter_search']['standard'].present?
      config[:datasource_search_twitter] = Cartodb.config[:datasource_search]['twitter_search']['standard']['search_url']
    end

    if Cartodb.config[:graphite_public].present?
      config[:statsd_host] = Cartodb.config[:graphite_public]['host']
      config[:statsd_port] = Cartodb.config[:graphite_public]['port']
    end

    if Cartodb.config[:error_track].present?
      config[:error_track_url] = Cartodb.config[:error_track]["url"]
      config[:error_track_percent_users] = Cartodb.config[:error_track]["percent_users"]
    end

    if Cartodb.config[:static_image_upload_endpoint].present?
      config[:static_image_upload_endpoint] = Cartodb.config[:static_image_upload_endpoint]
    end

    if Cartodb.config[:cdn_url].present?
      config[:cdn_url] = Cartodb.config[:cdn_url]
    end

    config.to_json
  end

  def frontend_config_public(options={ https_apis: false })
    api_type = (options[:https_apis].present? && options[:https_apis]) ? 'private' : 'public'

    config = {
      maps_api_template:   maps_api_template(api_type),
      user_name:           CartoDB.extract_subdomain(request),
      cartodb_com_hosted:  Cartodb.config[:cartodb_com_hosted],
      account_host:        CartoDB.account_host,
      max_asset_file_size: Cartodb.config[:assets]["max_file_size"],
      api_key:             ''
    }

    # Assumption: it is safe to expose private SQL API endpoint (or it is the same just using HTTPS)
    config[:sql_api_template] =  sql_api_template(api_type)

    if Cartodb.config[:graphite_public].present?
      config[:statsd_host] = Cartodb.config[:graphite_public]['host']
      config[:statsd_port] = Cartodb.config[:graphite_public]['port']
    end

    if Cartodb.config[:error_track].present?
      config[:error_track_url] = Cartodb.config[:error_track]["url"]
      config[:error_track_percent_users] = Cartodb.config[:error_track]["percent_users"]
    end

    if Cartodb.config[:cdn_url].present?
      config[:cdn_url] = Cartodb.config[:cdn_url]
    end

    if Cartodb.config[:explore_api].present?
      config[:explore_user] = Cartodb.config[:explore_api]['username']
    end

    if Cartodb.config[:common_data].present?
      config[:common_data_user] = Cartodb.config[:common_data]['username']
    end

    config.to_json
  end

  def stringified_member_type
    current_user.present? ? current_user.account_type.to_s.upcase : 'UNAUTHENTICATED'
  end

  def insert_google_analytics(track, public_view = false, custom_vars = {})
    if !Cartodb.config[:google_analytics].blank? && !Cartodb.config[:google_analytics][track].blank? && !Cartodb.config[:google_analytics]["domain"].blank?
      ua = Cartodb.config[:google_analytics][track]
      domain = Cartodb.config[:google_analytics]["domain"]

      render(:partial => 'shared/analytics', :locals => { ua: ua, domain: domain, custom_vars: custom_vars, public_view: public_view })
    end
  end

  def insert_trackjs(app = 'editor')
    if !Cartodb.config[:trackjs].blank? && !Cartodb.config[:trackjs]['customer'].blank?
      customer = Cartodb.config[:trackjs]['customer']
      enabled = Cartodb.config[:trackjs]['enabled']
      app_key = Cartodb.config[:trackjs]['app_keys'][app]

      render(:partial => 'shared/trackjs', :locals => { customer: customer, enabled: enabled, app_key: app_key })
    end
  end

  def insert_hubspot(app = 'editor')
    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank?
      token = CartoDB::Hubspot::instance.token
      event_ids = CartoDB::Hubspot::instance.event_ids

      render(:partial => 'shared/hubspot', :locals => { token: token, event_ids: event_ids })
    end
  end

  def insert_hubspot_form(form = 'newsletter')
    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank? && CartoDB::Hubspot::instance.form_ids.present? && !CartoDB::Hubspot::instance.form_ids[form].blank?
      token = CartoDB::Hubspot::instance.token

      render(:partial => 'shared/hubspot_form', :locals => { token: token, form_id: CartoDB::Hubspot::instance.form_ids[form] })
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
  end

  def v2_vizjson_url(visualization)
    "/api/v2/viz/#{visualization.id}/viz"
  end

  def formatted_tags(tags)
    visibleCount = 3

    tags.first(visibleCount).each_with_index do |tag, i|
      yield tag
      concat ', ' if i < visibleCount-1 && i < tags.size-1
    end

    if tags.size > visibleCount
      concat " and #{tags.size - visibleCount} more"
    end
  end

  def terms_path
    'https://cartodb.com/terms'
  end

  def privacy_path
    'https://cartodb.com/privacy'
  end

  def vis_json_url(vis_id, context, user=nil)
    "#{ CartoDB.url(context, 'api_v2_visualizations_vizjson', { id: vis_id }, user).sub(/(http:|https:)/i, '') }.json"
  end

  #if cartodb_com_hosted is false, means that it is SaaS. If it's true (or doesn't exist), it's a custom installation
  def cartodb_onpremise_version
    Cartodb.config[:onpremise_version]
  end

  # Wraps a JSON object to be loaded as a JS object in a safe way.
  #
  # @example expected usage (my-template.erb), illustrated with a Visualization object
  #   <script>
  #     var vizdata = <%= safe_js_object vis.to_vizjson.to_json %>;
  #   </script>
  #
  # @return string
  def safe_js_object(obj)
    # see http://api.rubyonrails.org/v3.2.21/classes/ERB/Util.html#method-c-j
    raw "JSON.parse('#{ j(obj.html_safe) }')"
  end
end
