# coding: utf-8
require_dependency 'cartodb_config_utils'
require_dependency 'carto/configuration'

module ApplicationHelper
  include Carto::Configuration
  include CartoDB::ConfigUtils
  include SafeJsObject
  include TrackjsHelper
  include GoogleAnalyticsHelper
  include GoogleTagManagerHelper
  include HubspotHelper
  include FrontendConfigHelper
  include AppAssetsHelper
  include MapsApiHelper
  include SqlApiHelper
  include Carto::HtmlSafe
  include CartoGearsApi::Helpers::PagesHelper

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  def show_footer?
    (controller_name == 'tables' && action_name != 'show') ||
    (controller_name == 'client_applications') || (controller_name == 'users')
  end

  def show_google_api_keys?(user)
    user.google_maps_geocoder_enabled? && (!user.organization.present? || user.organization_owner?)
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

  module_function :maps_api_template
  module_function :sql_api_template, :sql_api_url
  module_function :app_assets_base_url

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

  def insert_hubspot_form(form = 'newsletter')
    if CartoDB::Hubspot::instance.enabled? && !CartoDB::Hubspot::instance.token.blank? && CartoDB::Hubspot::instance.form_ids.present? && !CartoDB::Hubspot::instance.form_ids[form].blank?
      token = CartoDB::Hubspot::instance.token

      render(:partial => 'shared/hubspot_form', :locals => { token: token, form_id: CartoDB::Hubspot::instance.form_ids[form] })
    end
  end

  def insert_google_maps(query_string)
    render(partial: 'shared/google_maps', locals: { query_string: query_string })
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
      raise "Hey, #{source} is not in the precompile list (check application.rb). This will fall apart in production." unless Rails.application.config.assets.precompile.any? do |matcher|
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
    'https://carto.com/terms'
  end

  def privacy_path
    'https://carto.com/privacy'
  end

  def vis_json_url(vis_id, context, user=nil)
    "#{ CartoDB.url(context, 'api_v2_visualizations_vizjson', { id: vis_id }, user).sub(/(http:|https:)/i, '') }.json"
  end

  def vis_json_v3_url(vis_id, context, user=nil)
    "#{ CartoDB.url(context, 'api_v3_visualizations_vizjson', { id: vis_id }, user).sub(/(http:|https:)/i, '') }.json"
  end

  def model_errors(model)
    model.errors.full_messages.map(&:capitalize).join(', ') if model.errors.present?
  end
end
