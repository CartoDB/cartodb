# encoding: utf-8

require 'active_support/inflector'
require 'carto/api/vizjson3_presenter'

require_relative '../../models/table'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'

class Admin::PagesController < Admin::AdminController
  include Carto::HtmlSafe

  include CartoDB
  include VisualizationsControllerHelper

  DATASETS_PER_PAGE = 9
  MAPS_PER_PAGE = 9
  USER_TAGS_LIMIT = 100
  PAGE_NUMBER_PLACEHOLDER = 'PAGENUMBERPLACEHOLDER'

  # TODO logic as done client-side, how and where to encapsulate this better?
  GEOMETRY_MAPPING = {
    'st_multipolygon'    => 'polygon',
    'st_polygon'         => 'polygon',
    'st_multilinestring' => 'line',
    'st_linestring'      => 'line',
    'st_multipoint'      => 'point',
    'st_point'           => 'point'
  }


  ssl_required :common_data, :public, :datasets, :maps, :user_feed
  ssl_allowed :index, :sitemap, :datasets_for_user, :datasets_for_organization, :maps_for_user, :maps_for_organization,
              :render_not_found

  before_filter :login_required, :except => [:public, :datasets, :maps, :sitemap, :index, :user_feed]
  before_filter :load_viewed_entity
  before_filter :set_new_dashboard_flag
  before_filter :ensure_organization_correct
  skip_before_filter :browser_is_html5_compliant?, only: [:public, :datasets, :maps, :user_feed]
  skip_before_filter :ensure_user_organization_valid, only: [:public]

  helper_method :named_map_vizjson3

  # Just an entrypoint to dispatch to different places according to
  def index
    if current_user
      # I am logged in, visiting my subdomain -> my dashboard
      redirect_to CartoDB.url(self, 'dashboard', {}, current_user)
    elsif CartoDB.extract_subdomain(request).present?
      # I am visiting another user subdomain -> other user public pages
      redirect_to CartoDB.url(self, 'public_user_feed_home')
    elsif current_viewer
      # I am logged in but did not specify a subdomain -> my dashboard
      redirect_to CartoDB.url(self, 'dashboard', {}, current_viewer)
    else
      # I am not logged in and did not specify a subdomain -> login
      # Avoid using CartoDB.url helper, since we cannot get any user information from domain, path or session
      redirect_to login_url
    end
  end

  def common_data
    redirect_to CartoDB.url(self, 'datasets_library')
  end

  def sitemap
    if @viewed_user.nil?
      username = CartoDB.extract_subdomain(request)
      org = get_organization_if_exists(username)
      render_404 and return if org.nil?
      visualizations = (org.public_visualizations.to_a || [])
      visualizations += (org.public_datasets.to_a || [])
    else
      # Redirect to org url if has only user
      if eligible_for_redirect?(@viewed_user)
        redirect_to CartoDB.base_url(@viewed_user.organization.name) << CartoDB.path(self, 'public_sitemap') and return
      end

      visualizations = Carto::VisualizationQueryBuilder.new
                                                       .with_user_id(@viewed_user.id)
                                                       .with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
                                                       .with_order('visualizations.updated_at', :desc)
                                                       .without_raster
                                                       .with_prefetch_user(true)
                                                       .build
    end

    @urls = visualizations.map { |vis|
      case vis.type
      when Carto::Visualization::TYPE_DERIVED
        {
          loc: CartoDB.url(self, 'public_visualizations_public_map', { id: vis.id }, vis.user),
          lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
        }
      when Carto::Visualization::TYPE_CANONICAL
        {
          loc: CartoDB.url(self, 'public_table', { id: vis.name }, vis.user),
          lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
        }
      end
    }.compact
    render :formats => [:xml]
  end

  def datasets
    datasets = CartoDB::ControllerFlows::Public::Datasets.new(self)
    content = CartoDB::ControllerFlows::Public::Content.new(self, request, datasets)
    content.render()
  end

  def maps
    maps = CartoDB::ControllerFlows::Public::Maps.new(self)
    content = CartoDB::ControllerFlows::Public::Content.new(self, request, maps)
    content.render()
  end

  def public
    if current_user
      index
    else
      user_feed
    end
  end

  def user_feed
    # The template of this endpoint get the user_feed data calling
    # to another endpoint in the front-end part
    if @viewed_user.nil?
      username = CartoDB.extract_subdomain(request).strip.downcase
      org = get_organization_if_exists(username)
      unless org.nil?
        redirect_to CartoDB.url(self, 'public_maps_home') and return
      end
      render_404
    else

      set_layout_vars_for_user(@viewed_user, 'feed')

      dataset_builder = user_datasets_public_builder(@viewed_user)
      maps_builder = user_maps_public_builder(@viewed_user)

      @name                = @viewed_user.name_or_username
      @avatar_url          = @viewed_user.avatar
      @tables_num          = dataset_builder.build.count
      @maps_count          = maps_builder.build.count
      @website             = website_url(@viewed_user.website)
      @website_clean       = @website ? @website.gsub(/https?:\/\//, "") : ""

      if eligible_for_redirect?(@viewed_user)
        # redirect username.host.ext => org-name.host.ext/u/username
        redirect_to CartoDB.base_url(@viewed_user.organization.name, @viewed_user.username) <<
                            CartoDB.path(self, 'public_user_feed_home') and return
      end

      description = @name.dup

      # TODO: move to helper
      if @maps_count == 0 && @tables_num == 0
        description << " uses CARTO to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
      else
        description << " has"

        unless @maps_count == 0
          description << " created #{@maps_count} #{'map'.pluralize(@maps_count)}"
        end

        unless @maps_count == 0 || @tables_num == 0
          description << " and"
        end

        unless @tables_num == 0
          description << " published #{@tables_num} public #{'dataset'.pluralize(@tables_num)}"
        end

        description << " · View #{@name} CARTO profile for the latest activity and contribute to Open Data by creating an account in CARTO"
      end

      @page_description = description

      respond_to do |format|
        format.html { render 'user_feed', layout: 'public_user_feed' }
      end
    end
  end

  def datasets_for_user(user)
    set_layout_vars_for_user(user, 'datasets')
    render_datasets(user_datasets_public_builder(user), user)
  end

  def datasets_for_organization(org)
    set_layout_vars_for_organization(org, 'datasets')
    render_datasets(org_datasets_public_builder(org))
  end

  def maps_for_user(user)
    set_layout_vars_for_user(user, 'maps')
    render_maps(user_maps_public_builder(user), user)
  end

  def maps_for_organization(org)
    set_layout_vars_for_organization(org, 'maps')
    render_maps(org_maps_public_builder(org))
  end

  def render_not_found
    render_404
  end

  protected

  def eligible_for_redirect?(user)
    return false if CartoDB.subdomainless_urls?
    user.has_organization? && CartoDB.subdomain_from_request(request) != user.organization.name
  end

  def render_datasets(vis_query_builder, user = nil)
    home = CartoDB.url(self, 'public_datasets_home', { page: PAGE_NUMBER_PLACEHOLDER }, user)
    set_pagination_vars(total_count: vis_query_builder.build.count,
                        per_page: DATASETS_PER_PAGE,
                        first_page_url: CartoDB.url(self, 'public_datasets_home', {}, user),
                        numbered_page_url: home)

    @datasets = []

    vis_list = vis_query_builder.build_paged(current_page, DATASETS_PER_PAGE).map do |v|
      Carto::Admin::VisualizationPublicMapAdapter.new(v, current_user, self)
    end

    vis_list.each do |vis|
      @datasets << process_dataset_render(vis)
    end

    @datasets.compact!

    description = @name.dup

    # TODO: move to helper
    if @datasets.size == 0
      description << " uses CARTO to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
    else
      description << " has published #{@datasets.size} public #{'dataset'.pluralize(@datasets.size)}"
    end

    description << " · View #{@name} CARTO profile for the latest activity and contribute to Open Data by creating an account in CARTO"

    @page_description = description

    respond_to do |format|
      format.html { render 'public_datasets', layout: 'public_dashboard' }
    end
  end

  def render_maps(vis_query_builder, user=nil)
    set_pagination_vars({
        total_count: vis_query_builder.build.count,
        per_page:    MAPS_PER_PAGE,
        first_page_url: CartoDB.url(self, 'public_maps_home', {}, user),
        numbered_page_url: CartoDB.url(self, 'public_maps_home', {page: PAGE_NUMBER_PLACEHOLDER}, user)
      })

    vis_list = vis_query_builder.build_paged(current_page, MAPS_PER_PAGE).map do |v|
      Carto::Admin::VisualizationPublicMapAdapter.new(v, current_user, self)
    end

    @visualizations = []
    vis_list.each do |vis|
      @visualizations << process_map_render(vis)
    end

    @visualizations.compact!

    description = @name.dup

    # TODO: move to helper
    if @visualizations.size == 0 && @tables_num == 0
      description << " uses CARTO to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
    else
      description << " has"

      unless @visualizations.size == 0
        description << " created #{@visualizations.size} #{'map'.pluralize(@visualizations.size)}"
      end

      unless @visualizations.size == 0 || @tables_num == 0
        description << " and"
      end

      unless @tables_num == 0
        description << " published #{@tables_num} public #{'dataset'.pluralize(@tables_num)}"
      end

      description << " · View #{@name} CARTO profile for the latest activity and contribute to Open Data by creating an account in CARTO"
    end

    @page_description = description

    respond_to do |format|
      format.html { render 'public_maps', layout: 'public_dashboard' }
    end
  end

  def set_new_dashboard_flag
    ff_user = @viewed_user || @viewed_org.try(:owner)

    unless ff_user.nil?
      @has_new_dashboard = ff_user.builder_enabled?
    end
  end

  def set_layout_vars_for_user(user, content_type)
    builder = user_maps_public_builder(user, visualization_version)
    most_viewed = builder.with_order('mapviews', :desc).build_paged(1, 1).first

    set_layout_vars({
        most_viewed_vis_map: most_viewed ? Carto::Admin::VisualizationPublicMapAdapter.new(most_viewed, current_user, self) : nil,
        content_type: content_type,
        default_fallback_basemap: user.default_basemap,
        user: user,
        base_url: user.public_url(nil, request.protocol == "https://" ? "https" : "http")
      })
    set_shared_layout_vars(user, {
        name:       user.name_or_username,
        avatar_url: user.avatar,
      }, {
        available_for_hire: user.available_for_hire,
        email:              user.email,
        user: user
      })
  end

  def set_layout_vars_for_organization(org, content_type)
    most_viewed_vis_map = org.public_vis_by_type(Carto::Visualization::TYPE_DERIVED,
                                                 1,
                                                 1,
                                                 nil,
                                                 'mapviews',
                                                 visualization_version).first
    set_layout_vars(most_viewed_vis_map: most_viewed_vis_map,
                    content_type: content_type,
                    default_fallback_basemap: org.owner ? org.owner.default_basemap : nil,
                    base_url: '')
    set_shared_layout_vars(org,
                           name: org.display_name.blank? ? org.name : org.display_name,
                           avatar_url: org.avatar_url)
  end

  def set_layout_vars(required)
    @most_viewed_vis_map = required.fetch(:most_viewed_vis_map)
    @content_type        = required.fetch(:content_type)
    @maps_url            = CartoDB.url(view_context, 'public_maps_home', {}, required.fetch(:user, nil))
    @datasets_url        = CartoDB.url(view_context, 'public_datasets_home', {}, required.fetch(:user, nil))
    @default_fallback_basemap = required.fetch(:default_fallback_basemap, {})
    @base_url            = required.fetch(:base_url, {})
  end

  def set_pagination_vars(required)
    # Force all number pagination vars to be integers avoiding problems with
    # undesired strings
    @total_count  = required.fetch(:total_count, 0).to_i
    @per_page     = required.fetch(:per_page, 9).to_i
    @current_page = current_page.to_i
    @first_page_url = required.fetch(:first_page_url)
    @numbered_page_url = required.fetch(:numbered_page_url)
    @page_number_placeholder = PAGE_NUMBER_PLACEHOLDER
  end

  # Shared as in shared for both new and old layout
  def set_shared_layout_vars(model, required, optional = {})
    @twitter_username   = model.twitter_username
    @location           = model.location
    @description        = model.description
    @website            = website_url(model.website)
    @website_clean      = @website ? @website.gsub(/https?:\/\//, "") : ""
    @name               = required.fetch(:name)
    @avatar_url         = required.fetch(:avatar_url)
    @email              = optional.fetch(:email, nil)
    @available_for_hire = optional.fetch(:available_for_hire, false)
    @user               = optional.fetch(:user, nil)
    @is_org             = model.is_a? Organization
    @tables_num = (@is_org ? org_datasets_public_builder(model) : user_datasets_public_builder(model)).build.count
    @maps_count = (@is_org ? org_maps_public_builder(model) : user_maps_public_builder(model)).build.count

    @needs_gmaps_lib = @most_viewed_vis_map.try(:map).try(:provider) == 'googlemaps'
    @needs_gmaps_lib ||= @default_fallback_basemap['className'] == 'googlemaps'

    gmaps_user = @most_viewed_vis_map.try(:user) || @viewed_user
    @gmaps_query_string = gmaps_user ? gmaps_user.google_maps_query_string : @viewed_org.google_maps_key
  end

  def user_datasets_public_builder(user)
    public_builder(user_id: user.id, vis_type: Carto::Visualization::TYPE_CANONICAL)
  end

  def user_maps_public_builder(user, version = nil)
    public_builder(user_id: user.id, vis_type: Carto::Visualization::TYPE_DERIVED, version: version)
  end

  def org_datasets_public_builder(org)
    public_builder(vis_type: Carto::Visualization::TYPE_CANONICAL, organization_id: org.id)
  end

  def org_maps_public_builder(org)
    public_builder(vis_type: Carto::Visualization::TYPE_DERIVED, organization_id: org.id)
  end

  def public_builder(user_id: nil, vis_type: nil, organization_id: nil, version: nil)
    tags = tag_or_nil.nil? ? nil : [tag_or_nil]

    builder = Carto::VisualizationQueryBuilder.new
                                              .with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
                                              .without_raster
                                              .with_order(:updated_at, :desc)
                                              .with_user_id(user_id)
                                              .with_type(vis_type)
                                              .with_tags(tags)
                                              .with_organization_id(organization_id)
                                              .with_version(version)

    builder.with_published if vis_type == Carto::Visualization::TYPE_DERIVED

    builder
  end

  def visualization_version
    @has_new_dashboard ? Carto::Visualization::VERSION_BUILDER : nil
  end

  def named_map_vizjson3(visualization)
    generate_named_map_vizjson3(Carto::Visualization.find(visualization.id))
  end

  def get_organization_if_exists(name)
    Organization.where(name: name).first
  end

  def current_page
    params[:page].to_i > 0 ? params[:page] : 1
  end

  def tag_or_nil
    params[:tag]
  end

  def ensure_organization_correct
    return if CartoDB.subdomainless_urls?

    user_or_org_domain = CartoDB.subdomain_from_request(request)
    user_domain = CartoDB.extract_subdomain(request)
    user = ::User.where(username: user_domain).first

    unless user.nil?
      if user.username != user_or_org_domain and not user.belongs_to_organization?(get_organization_if_exists(user_or_org_domain))
        render_404
      end
    end
  end

  def process_dataset_render(dataset)
    geometry_type = dataset.kind
    if geometry_type != 'raster'
      table_geometry_types = dataset.table.geometry_types
      geometry_type = table_geometry_types.first.present? ? GEOMETRY_MAPPING.fetch(table_geometry_types.first.downcase, '') : ''
    end

    begin
      vis_item(dataset).merge({
        rows_count: dataset.table.rows_counted,
        size_in_bytes: dataset.table.table_size,
        geometry_type: geometry_type,
        source: markdown_html_safe(dataset.source)
      })
    rescue => e
      # A dataset might be invalid. For example, having the table deleted and not yet cleaned.
      # We don't want public page to be broken, but error must be traced.
      CartoDB.notify_exception(e, { vis: dataset })
      nil
    end
  end

  def process_map_render(map)
    vis_item(map)
  end

  def vis_item(vis)
    return {
      id:          vis.id,
      title:       vis.name,
      description: markdown_html_safe(vis.description),
      tags:        vis.tags,
      updated_at:  vis.updated_at,
      owner:       vis.user,
      likes_count: vis.likes.count,
      map_zoom:    vis.map.zoom
    }
  end

  def load_viewed_entity
    username = CartoDB.extract_subdomain(request)
    @viewed_user = ::User.where(username: username).first

    if @viewed_user.nil?
      username = username.strip.downcase
      @viewed_org = get_organization_if_exists(username)
    end
  end


  def website_url(url)
    if url.blank?
      ""
    else
      !url.blank? && url[/^https?:\/\//].nil? ? "http://#{url}" : url
    end
  end

end
