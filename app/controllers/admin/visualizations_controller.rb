require_relative '../../models/map/presenter'
require_relative '../carto/admin/user_table_public_map_adapter'
require_relative '../carto/admin/visualization_public_map_adapter'
require_relative '../carto/api/visualization_presenter'
require_relative '../carto/api/received_notification_presenter'
require_relative '../../helpers/embed_redis_cache'

require_dependency 'carto/tracking/events'
require_dependency 'resque/user_jobs'
require_dependency 'static_maps_url_helper'
require_dependency 'carto/helpers/frame_options_helper'
require_dependency 'carto/visualization'
require_dependency 'carto/uuidhelper'

class Admin::VisualizationsController < Admin::AdminController
  include CartoDB, VisualizationsControllerHelper
  include Carto::FrameOptionsHelper
  include Carto::UUIDHelper

  MAX_MORE_VISUALIZATIONS = 3
  DEFAULT_PLACEHOLDER_CHARS = 4

  ssl_allowed :embed_map, :public_map, :show_protected_embed_map, :public_table,
              :show_organization_public_map, :show_organization_embed_map,
              :embed_protected, :public_map_protected, :embed_forbidden, :track_embed
  ssl_required :index, :show, :protected_public_map, :show_protected_public_map

  before_filter :x_frame_options_allow, only: [:embed_forbidden, :embed_map, :embed_protected,
                                               :show_organization_embed_map, :show_protected_embed_map,
                                               :track_embed]
  before_filter :login_required, only: [:index]
  before_filter :table_and_schema_from_params, only: [:show, :public_table, :public_map, :show_protected_public_map,
                                                      :show_protected_embed_map, :embed_map]
  before_filter :get_viewed_user_or_org, only: [:public_map,
                                                :public_table,
                                                :show_protected_public_map,
                                                :show_organization_public_map,
                                                :public_map_protected,
                                                :embed_map,
                                                :embed_protected]

  before_filter :resolve_visualization_and_table,
                :ensure_visualization_viewable,
                only: [:show, :public_table, :public_map,
                       :show_organization_public_map, :show_organization_embed_map,
                       :show_protected_public_map, :show_protected_embed_map]

  before_filter :resolve_visualization_and_table_if_not_cached, only: [:embed_map]
  before_filter :redirect_to_kuviz_if_needed, only: [:embed_map]
  before_filter :redirect_to_app_if_needed, only: [:embed_map]
  before_filter :redirect_to_builder_embed_if_v3, only: [:embed_map, :show_organization_public_map,
                                                         :show_organization_embed_map, :show_protected_public_map,
                                                         :show_protected_embed_map,
                                                         :public_map, :show_protected_public_map]

  after_filter :update_user_last_activity, only: [:show]

  skip_before_filter :browser_is_html5_compliant?, only: [:public_map, :embed_map, :track_embed,
                                                          :show_protected_embed_map, :show_protected_public_map]
  skip_before_filter :verify_authenticity_token, only: [:show_protected_public_map, :show_protected_embed_map]

  def index
    render(file: "public/static/dashboard/index.html", layout: false)
  end

  def show
    table_action = request.original_fullpath =~ %r{/tables/}
    unless current_user.present?
      if table_action
        return(redirect_to CartoDB.url(self, 'public_table_map', params: { id: request.params[:id] }))
      else
        return(redirect_to CartoDB.url(self, 'public_visualizations_public_map', params: { id: request.params[:id] }))
      end
    end

    @google_maps_query_string = @visualization.user.google_maps_query_string
    @basemaps = @visualization.user.basemaps

    if table_action
      if current_user.builder_enabled? && @visualization.has_read_permission?(current_user)
        return redirect_to CartoDB.url(self, 'builder_dataset', params: { id: request.params[:id] }, user: current_user)
      elsif !@visualization.has_write_permission?(current_user)
        return redirect_to CartoDB.url(self, 'public_table_map', params: { id: request.params[:id], redirected: true })
      end
    elsif current_user.builder_enabled? && !@visualization.open_in_editor?
      return redirect_to CartoDB.url(self, 'builder_visualization', params: { id: request.params[:id] },
                                                                    user: current_user)
    elsif current_user.has_feature_flag?('static_editor') && !current_user.builder_enabled?
      return render(file: 'public/static/show/index.html', layout: false)
    elsif !@visualization.has_write_permission?(current_user)
      return redirect_to CartoDB.url(self, 'public_visualizations_public_map',
                                     params: { id: request.params[:id], redirected: true })
    end

    if @visualization.is_privacy_private? && @visualization.has_read_permission?(current_user)
      @auth_tokens = current_user.get_auth_tokens
    end

    respond_to { |format| format.html }
  end

  def public_table
    return(render_pretty_404) if @visualization.private?

    if @visualization.derived?
      if current_user.nil? || current_user.username != request.params[:user_domain]
        destination_user = ::User.where(username: request.params[:user_domain]).first
      else
        destination_user = nil
      end
      return(redirect_to CartoDB.url(self, 'public_visualizations_public_map', params: { id: request.params[:id] },
                                                                               user: destination_user))
    end

    if current_user.nil? && !request.params[:redirected].present?
      redirect_url = get_corrected_url_if_proceeds(for_table=true)
      unless redirect_url.nil?
        redirect_to redirect_url and return
      end
    end

    if @visualization.organization?
      unless current_user && @visualization.has_read_permission?(current_user)
        return(embed_forbidden)
      end
    end

    return(redirect_to protocol: 'https://') if @visualization.is_privacy_private? \
                                                && Cartodb.get_config(:ssl_required) == true

    # Legacy redirect, now all public pages also with org. name
    if eligible_for_redirect?(@visualization.user)
      redirect_to CartoDB.url(self,
                              'public_table',
                              params: { id: params[:id].to_s, redirected: true },
                              user: @visualization.user)
      return
    end

    @vizjson = @visualization.to_vizjson({https_request: request.protocol == 'https://'})
    @auth_tokens = nil
    @use_https = false
    @api_key = nil
    @can_copy = false

    if current_user && @visualization.has_read_permission?(current_user)
      if @visualization.is_privacy_private?
        @auth_tokens = current_user.get_auth_tokens
        @use_https = true
        @api_key = current_user.api_key
      end
      @can_copy = true # this table can be copied to user dashboard
    end

    owner = @visualization.user
    # set user to current user only if the user is in the same organization
    # this allows to enable "copy this table to your tables" button
    if current_user && current_user.organization.present? && owner.organization.present? &&
        current_user.organization_id == owner.organization_id
      @user = current_user
      response.headers['Cache-Control'] = "no-cache,private"
    else
      @user = @visualization.user
    end

    @name = @visualization.user.name_or_username
    @user_url = CartoDB.url(self, 'public_user_feed_home', user: @visualization.user)

    @is_data_library = data_library_user?

    if @is_data_library
      @name = "Data Library"
      @user_url = Cartodb.get_config(:data_library, 'path') ? "#{request.protocol}#{CartoDB.account_host}#{Cartodb.get_config(:data_library, 'path')}" : @user_url
    end

    @avatar_url             = @visualization.user.avatar
    @twitter_username       = @visualization.user.twitter_username.present? ? @visualization.user.twitter_username : nil
    @location               = @visualization.user.location.present? ? @visualization.user.location : nil

    @user_domain = user_domain_variable(request)

    @visualization_id = @visualization.id

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @public_tables_count    = @visualization.user.public_table_count

    @total_visualizations = @table.dependent_visualizations.select do |vis|
      vis.privacy == Carto::Visualization::PRIVACY_PUBLIC && vis.published?
    end

    @total_nonpublic_total_vis_count = @table.dependent_visualizations.reject { |vis|
      vis.privacy == Carto::Visualization::PRIVACY_PUBLIC
    }.count

    # Public export API SQL url
    @export_sql_api_url = "#{ sql_api_url("SELECT * FROM #{ @table.owner.sql_safe_database_schema }.#{ @table.name }", @user) }&format=shp"

    respond_to do |format|
      format.html { render 'public_dataset', layout: 'application_table_public' }
    end
  end

  def public_map
    if current_user.nil? && !request.params[:redirected].present?
      redirect_url = get_corrected_url_if_proceeds(for_table=false)
      unless redirect_url.nil?
        redirect_to redirect_url and return
      end
    end

    return(embed_forbidden) unless @visualization.is_accesible_by_user?(current_user)

    if current_user && @visualization.is_privacy_private? &&
       @visualization.has_read_permission?(current_user)
      return(show_organization_public_map)
    end

    # Legacy redirect, now all public pages also with org. name
    if eligible_for_redirect?(@visualization.user)
      # INFO: here we only want the presenter to rewrite the url of @visualization.user namespacing it like 'schema.id',
      # so current_user also equals @visualization.user
      visualization_presenter = Carto::Api::VisualizationPresenter.new(@visualization, @visualization.user, self)
      redirect_to visualization_presenter.privacy_aware_map_url({ redirected: true },
                                                                'public_visualizations_public_map') and return
    end

    return(public_map_protected) if @visualization.password_protected?

    if @visualization.can_be_cached?
      response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    end

    if @more_visualizations && @more_visualizations.length > 0
      additional_keys = []
      @more_visualizations.each do |vis_adapter|
        additional_keys << vis_adapter.visualization.surrogate_key
      end
      additional_keys = " #{additional_keys.join(' ')}"
    else
      additional_keys = ''
    end

    if @visualization.can_be_cached?
      response.headers['Surrogate-Key'] =
        "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@visualization.surrogate_key}#{additional_keys}"

      response.headers['Cache-Control'] = "no-cache,max-age=86400,must-revalidate, public"
    end

    @name = @visualization.user.name_or_username
    @avatar_url             = @visualization.user.avatar
    @twitter_username       = @visualization.user.twitter_username.present? ? @visualization.user.twitter_username : nil
    @location               = @visualization.user.location.present? ? @visualization.user.location : nil
    @google_maps_query_string = @visualization.user.google_maps_query_string

    @mapviews = @visualization.total_mapviews

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @related_canonical_visualizations = @visualization.related_canonical_visualizations
    @related_tables_owners = Hash.new
    @related_tables.each { |table|
      unless @related_tables_owners.include?(table.user_id)
        table_owner = ::User.where(id: table.user_id).first
        if table_owner.nil?
          # strange scenario, as user has been deleted but their table still exists
          @related_tables_owners[table.user_id] = nil
        else
          @related_tables_owners[table.user_id] = table_owner
        end
      end
    }

    @user_domain = user_domain_variable(request)

    @public_tables_count    = @visualization.user.public_table_count
    @nonpublic_tables_count = @related_tables.select{|t| !t.public? }.count

    # We need to know if visualization logo is visible or not
    @hide_logo = is_logo_hidden(@visualization, params)

    respond_to do |format|
      format.html { render layout: 'application_public_visualization_layout' }
      format.js { render 'public_map', content_type: 'application/javascript' }
    end
  rescue StandardError => e
    CartoDB.notify_exception(e, user: current_user)
    embed_forbidden
  end

  def show_organization_public_map
    return(embed_forbidden) unless org_user_has_map_permissions?(current_user, @visualization)

    response.headers['Cache-Control'] = "no-cache,private"

    @protected_map_tokens = current_user.get_auth_tokens

    @name = @visualization.user.name_or_username
    @avatar_url = @visualization.user.avatar

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @related_canonical_visualizations = @visualization.related_canonical_visualizations
    @public_tables_count    = @visualization.user.public_table_count
    @nonpublic_tables_count = @related_tables.select{|p| !p.public? }.count

    # We need to know if visualization logo is visible or not
    @hide_logo = is_logo_hidden(@visualization, params)

    respond_to do |format|
      format.html { render 'public_map', layout: 'application_public_visualization_layout' }
    end
  end

  def show_organization_embed_map
    return(embed_forbidden) unless org_user_has_map_permissions?(current_user, @visualization)

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@visualization.surrogate_key}"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    @protected_map_tokens = current_user.get_auth_tokens

    respond_to do |format|
      format.html { render 'embed_map', layout: 'application_public_visualization_layout' }
    end
  end

  def show_protected_public_map
    submitted_password = params.fetch(:password, nil)
    return(render_pretty_404) unless @visualization.password_protected? and @visualization.has_password?

    unless @visualization.password_valid?(submitted_password)
      flash[:placeholder] = '*' * (submitted_password ? submitted_password.size : DEFAULT_PLACEHOLDER_CHARS)
      flash[:error] = "Invalid password"
      return(public_map_protected)
    end

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@visualization.surrogate_key}"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    @protected_map_tokens = @visualization.get_auth_tokens

    @name = @visualization.user.name_or_username
    @avatar_url = @visualization.user.avatar

    @user_domain = user_domain_variable(request)

    @disqus_shortname       = @visualization.user.disqus_shortname.presence || 'cartodb'
    @visualization_count    = @visualization.user.public_visualization_count
    @related_tables         = @visualization.related_tables
    @related_canonical_visualizations = @visualization.related_canonical_visualizations
    @public_tables_count    = @visualization.user.public_table_count
    @nonpublic_tables_count = @related_tables.select{|p| !p.public? }.count

    # We need to know if visualization logo is visible or not
    @hide_logo = is_logo_hidden(@visualization, params)

    respond_to do |format|
      format.html { render 'public_map', layout: 'application_public_visualization_layout' }
    end
  rescue StandardError => e
    log_error(exception: e)
    public_map_protected
  end

  def show_protected_embed_map
    submitted_password = params.fetch(:password, nil)
    return(render_pretty_404) unless @visualization.password_protected? and @visualization.has_password?

    unless @visualization.password_valid?(submitted_password)
      flash[:placeholder] = '*' * (submitted_password ? submitted_password.size : DEFAULT_PLACEHOLDER_CHARS)
      flash[:error] = "Invalid password"
      return(embed_protected)
    end

    response.headers['Cache-Control']   = "no-cache, private"

    @protected_map_tokens = @visualization.get_auth_tokens

    respond_to do |format|
      format.html { render 'embed_map', layout: 'application_public_visualization_layout' }
    end
  rescue StandardError => e
    log_error(exception: e)
    embed_protected
  end

  def embed_map
    if request.format == 'text/javascript'
      error_message = "/* Javascript embeds are deprecated, please use the html iframe instead */"
      return render inline: error_message, status: 400
    end

    if @cached_embed
      response.headers.merge! @cached_embed[:headers].stringify_keys
      respond_to do |format|
        # Use html_safe to mark the string as trusted since it comes from a successful response.
        # We cannot use `render body: @cached_embed[:body]` in Rails 3
        format.html { render inline: "<%= @cached_embed[:body].html_safe %>" }
      end
    else
      resp = embed_map_actual
      if response.ok? && (@visualization.public? || @visualization.public_with_link?)
        # cache response
        is_https = (request.protocol == 'https://')
        embed_redis_cache.set(@visualization.id, is_https, response.headers, response.body)
      end
      resp
    end
  end

  # Renders input password view
  def embed_protected
    render 'embed_map_password', :layout => 'application_password_layout'
  end

  def public_map_protected
    render 'public_map_password', :layout => 'application_password_layout'
  end

  def embed_forbidden
    render 'embed_map_error', layout: false, status: :forbidden
  end

  def track_embed
    response.headers['X-Cache-Channel'] = "embeds_google_analytics"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"
    render 'track', layout: false
  end

  protected

  def disallowed_type?(visualization)
    return true if visualization.nil?
    visualization.type_slide?
  end

  # Check if visualization logo should be hidden or not
  def is_logo_hidden(vis, parameters)
    has_logo  = vis.overlays.any? {|o| o.type == "logo" }
    (!has_logo && vis.user.remove_logo? && (!parameters['cartodb_logo'] || parameters['cartodb_logo'] != "true")) || (has_logo && vis.user.remove_logo? && (parameters["cartodb_logo"] == 'false'))
  end

  private

  def more_visualizations(user, excluded_visualization)
    vqb = Carto::VisualizationQueryBuilder.user_public_visualizations(user).with_order(:updated_at, :desc)
    vqb.with_excluded_ids([excluded_visualization.id]) if excluded_visualization
    visualizations = vqb.build_paged(1, MAX_MORE_VISUALIZATIONS)
    visualizations.map { |v|
      Carto::Admin::VisualizationPublicMapAdapter.new(v, current_user, self)
    }
  end

  def eligible_for_redirect?(user)
    return false if CartoDB.subdomainless_urls?
    user.has_organization? && !request.params[:redirected].present? &&
      CartoDB.subdomain_from_request(request) != user.organization.name
  end

  def org_user_has_map_permissions?(user, visualization)
    user && visualization && visualization.has_read_permission?(user)
  end

  def resolve_visualization_and_table
    filters = { exclude_raster: true }
    @visualization, @table =
      get_visualization_and_table(@table_id, username_from_schema || CartoDB.extract_subdomain(request), filters)
    if @visualization && @visualization.user
      @more_visualizations = more_visualizations(@visualization.user, @visualization)
    end
  end

  def ensure_visualization_viewable
    render_pretty_404 if disallowed_type?(@visualization)
  end

  def resolve_visualization_and_table_if_not_cached
    is_https = (request.protocol == 'https://')
    # TODO review the naming confusion about viz and tables, I suspect templates also need review
    @cached_embed = embed_redis_cache.get(@table_id, is_https)
    if !@cached_embed
      resolve_visualization_and_table
      render('embed_map_error', layout: false, status: :not_found) if disallowed_type?(@visualization)
    end
  end

  # If user A shares to user B a table link (being both from same org), attept to rewrite the url to the correct format
  # Messing with sessions is bad so just redirect to newly formed url and let new request handle permissions/access
  def get_corrected_url_if_proceeds(for_table=true)
    url = nil

    return url if CartoDB.subdomainless_urls?

    org_name = CartoDB.subdomain_from_request(request)
    if CartoDB.extract_subdomain(request) != org_name
      # Might be an org url, try getting the org
      organization = Carto::Organization.find_by(name: org_name)
      unless organization.nil?
        authenticated_users = request.session.to_hash.select { |k, _v|
          k.start_with?("warden.user") && !k.end_with?(".session")
        }.values
        authenticated_users.each { |username|
          user = ::User.where(username: username).first
          if url.nil? && !user.nil? && !user.organization.nil?
            if user.organization.id == organization.id
              if for_table
                url = CartoDB.url(self, 'public_tables_show',
                                  params: { id: "#{params[:user_domain]}.#{params[:id]}", redirected: true },
                                  user: user)
              else
                url = CartoDB.url(self, 'public_visualizations_show',
                                  params: { id: "#{params[:user_domain]}.#{params[:id]}", redirected: true },
                                  user: user)
              end
            end
          end
        }
      end
    end
    url
  end

  def username_from_schema
    (@schema && @schema != 'public') ? @schema : nil
  end

  def table_and_schema_from_params
    if params.fetch('id', nil) =~ /\./
      @table_id, @schema = params.fetch('id').split('.').reverse
    else
      @table_id, @schema = [params.fetch('id', nil), nil]
    end
  end

  def full_table_id
    id = @table_id
    if @schema
      id = @schema + "." + id
    end
    id
  end

  def public_url
    if request.path_info =~ %r{/tables/}
      CartoDB.path(self, 'public_table', { id: full_table_id })
    else
      CartoDB.path(self, 'public_visualization', { id: full_table_id })
    end
  end

  def public_map_url
    if request.path_info =~ %r{/tables/}
      CartoDB.path(self, 'public_table_map', { id: full_table_id })
    else
      CartoDB.path(self, 'public_visualizations_public_map', { id: full_table_id })
    end
  end

  def embed_map_url_for(id)
    if request.path_info =~ %r{/tables/}
      CartoDB.path(self, 'public_tables_embed_map', { id: id })
    else
      CartoDB.path(self, 'public_visualizations_embed_map', { id: id })
    end
  end

  def download_formats(table, format)
    format.sql  { send_data table.to_sql, data_for(table, 'zip', 'zip') }
    format.kml  { send_data table.to_kml, data_for(table, 'zip', 'kmz') }
    format.csv  { send_data table.to_csv, data_for(table, 'zip', 'zip') }
    format.shp  { send_data table.to_shp, data_for(table, 'octet-stream', 'zip') }
  end

  def data_for(table, type, extension)
    {
      type:         "application/#{type}; charset=binary; header=present",
      disposition:  "attachment; filename=#{table.name}.#{extension}"
    }
  end

  def render_pretty_404
    render(file: "public/404.html", layout: false, status: 404)
  end

  def user_domain_variable(request)
    if params[:user_domain].present?
      CartoDB.subdomain_from_request(request) != params[:user_domain] ? params[:user_domain] : nil
    else
      nil
    end
  end

  def get_visualization_and_table(table_id, schema, filter)
    user = Carto::User.where(username: schema).first
    # INFO: organization public visualizations
    if user
      visualization = get_priority_visualization(table_id, user_id: user.id)
    else
      organization = Carto::Organization.where(name: schema).first
      visualization = get_priority_visualization(table_id, organization_id: organization.id) if organization
    end

    return get_visualization_and_table_from_table_id(table_id) if visualization.nil?
    render_pretty_404 if visualization.kind == Carto::Visualization::KIND_RASTER
    return Carto::Admin::VisualizationPublicMapAdapter.new(visualization, current_user, self), visualization.table_service
  end

  def get_visualization_and_table_from_table_id(table_id)
    return nil, nil if !uuid?(table_id)
    user_table = Carto::UserTable.where({ id: table_id }).first
    return nil, nil if user_table.nil?
    visualization = user_table.visualization
    return Carto::Admin::VisualizationPublicMapAdapter.new(visualization, current_user, self), visualization.table_service
  end

  def sql_api_url(query, user)
    "#{ ApplicationHelper.sql_api_template("public").gsub! '{user}', user.username }#{Cartodb.get_config(:sql_api, 'public', 'endpoint')}?q=#{ URI::encode query }"
  end

  def embed_map_actual
    return(embed_forbidden) if @visualization.private?
    return(embed_protected) if @visualization.password_protected?
    return(show_organization_embed_map) if org_user_has_map_permissions?(current_user, @visualization)

    response.headers['X-Cache-Channel'] = "#{@visualization.varnish_key}:vizjson"
    response.headers['Surrogate-Key'] = "#{CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES} #{@visualization.surrogate_key}"
    response.headers['Cache-Control']   = "no-cache,max-age=86400,must-revalidate, public"

    # We need to know if visualization logo is visible or not
    @hide_logo = is_logo_hidden(@visualization, params)

    respond_to do |format|
      format.html { render layout: 'application_public_visualization_layout' }
    end
  rescue StandardError => e
    log_error(exception: e)
    embed_forbidden
  end

  def embed_redis_cache
    @embed_redis_cache ||= EmbedRedisCache.new($tables_metadata)
  end

  def get_viewed_user_or_org
    subdomain = CartoDB.extract_subdomain(request)
    @viewed_user = Carto::User.where(username: subdomain).first

    if @viewed_user.nil?
      @org = get_organization_if_exists(subdomain)
    end
  end

  def get_organization_if_exists(name)
    Carto::Organization.where(name: name).first
  end

  def data_library_user?
    @viewed_user && Cartodb.get_config(:data_library, 'username') == @viewed_user.username
  end

  def redirect_to_kuviz_if_needed
    redirect_to(CartoDB.url(self, 'kuviz_show', params: { id: @visualization.id })) if @visualization&.kuviz?
  end

  def redirect_to_app_if_needed
    redirect_to(CartoDB.url(self, 'app_show', params: { id: @visualization.id })) if @visualization&.app?
  end

  def redirect_to_builder_embed_if_v3
    # @visualization is not loaded if the embed is cached
    # Changing version invalidates the embed cache
    if @visualization && @visualization.version == 3
      redirect_to CartoDB.url(self, 'builder_visualization_public_embed',
                              params: { visualization_id: @visualization.id })
    end
  end
end
