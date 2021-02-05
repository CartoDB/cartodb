require_dependency 'cartodb_config_utils'
require_dependency 'carto/configuration'

module ApplicationHelper
  include Carto::Configuration
  include CartoDB::ConfigUtils
  include SafeJsObject
  include TrackjsHelper
  include GoogleTagManagerHelper
  include FrontendConfigHelper
  include AppAssetsHelper
  include MapsApiHelper
  include MapsApiV2Helper
  include SqlApiHelper
  include Carto::HtmlSafe
  include CartoGearsApi::Helpers::PagesHelper

  def current_user
    super(CartoDB.extract_subdomain(request))
  end

  def current_viewer
    controller.current_viewer
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

  module_function :maps_api_template, :maps_api_url
  module_function :maps_api_v2_template, :maps_api_v2_url
  module_function :sql_api_template, :sql_api_url
  module_function :app_assets_base_url

  def frontend_config_public(options={ https_apis: false })
    api_type = (options[:https_apis].present? && options[:https_apis]) ? 'private' : 'public'

    config = {
      # region:              Cartodb.get_config(:bigquery_region),
      # FIXME: debug
      region: 'US',
      maps_api_template:   maps_api_template(api_type),
      maps_api_v2_template: maps_api_v2_template,
      user_name:           CartoDB.extract_subdomain(request),
      cartodb_com_hosted:  Cartodb.get_config(:cartodb_com_hosted),
      account_host:        CartoDB.account_host,
      max_asset_file_size: Cartodb.get_config(:assets, 'max_file_size'),
      api_key:             ''
    }

    # Assumption: it is safe to expose private SQL API endpoint (or it is the same just using HTTPS)
    config[:sql_api_template] = sql_api_template(api_type)

    if Cartodb.get_config(:graphite_public)
      config[:statsd_host] = Cartodb.get_config(:graphite_public, 'host')
      config[:statsd_port] = Cartodb.get_config(:graphite_public, 'port')
    end

    if Cartodb.get_config(:error_track)
      config[:error_track_url] = Cartodb.get_config(:error_track, 'url')
      config[:error_track_percent_users] = Cartodb.get_config(:error_track, 'percent_users')
    end

    if Cartodb.get_config(:cdn_url)
      config[:cdn_url] = Cartodb.get_config(:cdn_url)
    end

    if Cartodb.get_config(:explore_api)
      config[:explore_user] = Cartodb.get_config(:explore_api, 'username')
    end

    if Cartodb.get_config(:common_data)
      config[:common_data_user] = Cartodb.get_config(:common_data, 'username')
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

  def sources_with_path(asset_type, sources)
    path = if sources.first == :editor
             sources.shift
             "editor/#{editor_assets_version}"
           else
             frontend_version
           end

    # raise_on_asset_absence sources

    sources_with_prefix("/#{path}/#{asset_type}/", sources)
  end

  def sources_with_prefix(path, sources)
    options = sources.extract_options!.stringify_keys
    with_full_path = []
    sources.each do |source|
      with_full_path << path + source
    end

    with_full_path << options
  end

  ##
  # Checks that the precompile list contains this file or raises an error, in dev only
  # Note: You will need to move config.assets.precompile to application.rb from production.rb

  def javascript_include_tag(*sources)
    super *sources_with_path('javascripts', sources)
  end

  def stylesheet_link_tag(*sources)
    super *sources_with_path('stylesheets', sources)
  end

  def image_path(source, editor = false)
    if editor
      super "/editor/#{editor_assets_version}/images/#{source}"
    else
      super "/#{frontend_version}/images/#{source}"
    end
  end

  def image_tag(source, options={})
    super "/#{frontend_version}/images/#{source}", options
  end

  def editor_image_path(source)
    image_path(source, true)
  end

  def favicon_link_tag(source)
    super "/#{frontend_version}/#{source}"
  end

  def editor_stylesheet_link_tag(*sources)
    stylesheet_link_tag *([:editor] + sources)
  end

  def editor_javascript_include_tag(*sources)
    javascript_include_tag *([:editor] + sources)
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

  def vis_json_url(vis_id, context, user = nil)
    "#{CartoDB.url(context, 'api_v2_visualizations_vizjson',
                   params: { id: vis_id }, user: user).sub(/(http:|https:)/i, '')}.json"
  end

  def vis_json_v3_url(vis_id, context, user = nil)
    "#{CartoDB.url(context, 'api_v3_visualizations_vizjson',
                   params: { id: vis_id }, user: user).sub(/(http:|https:)/i, '')}.json"
  end

  def model_errors(model)
    model.errors.full_messages.map(&:capitalize).join(', ') if model.errors.present?
  end
end
