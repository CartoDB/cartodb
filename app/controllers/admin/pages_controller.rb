# encoding: utf-8

require 'active_support/inflector'

require_relative '../../models/table'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'

class Admin::PagesController < Admin::AdminController

  include CartoDB

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
  before_filter :get_viewed_user
  before_filter :ensure_organization_correct
  skip_before_filter :browser_is_html5_compliant?, only: [:public, :datasets, :maps, :user_feed]
  skip_before_filter :ensure_user_organization_valid, only: [:public]


  # Just an entrypoint to dispatch to different places according to
  def index
    CartoDB.subdomainless_urls? ? index_subdomainless : index_subdomainfull
  end

  def common_data
    redirect_to CartoDB.url(self, 'datasets_library')
  end

  def sitemap
    if @viewed_user.nil?
      username = CartoDB.extract_subdomain(request)
      org = get_organization_if_exists(username)
      return if org.nil?
      visualizations = (org.public_visualizations.to_a || [])
      visualizations += (org.public_datasets.to_a || [])
    else
      # Redirect to org url if has only user
      if eligible_for_redirect?(@viewed_user)
        redirect_to CartoDB.base_url(@viewed_user.organization.name) << CartoDB.path(self, 'public_sitemap') and return
      end

      visualizations = Visualization::Collection.new.fetch({
        user_id:  @viewed_user.id,
        privacy:  Visualization::Member::PRIVACY_PUBLIC,
        order:    'updated_at',
        o:        {updated_at: :desc},
        exclude_shared: true,
        exclude_raster: true
      })
    end

    @urls = visualizations.collect{ |vis|
      case vis.type
        when Visualization::Member::TYPE_DERIVED
          {
            loc: CartoDB.url(self, 'public_visualizations_public_map', {id: vis[:id] }, vis.user),
            lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
          }
        when Visualization::Member::TYPE_CANONICAL
          {
            loc: CartoDB.url(self, 'public_table', {id: vis.name }, vis.user),
            lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
          }
        else
          nil
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

      @name               = @viewed_user.name.blank? ? @viewed_user.username : @viewed_user.name
      @avatar_url         = @viewed_user.avatar
      @tables_num         = @viewed_user.public_table_count
      @maps_count         = @viewed_user.public_visualization_count
      @website            = website_url(@viewed_user.website)
      @website_clean      = @website ? @website.gsub(/https?:\/\//, "") : ""

      if eligible_for_redirect?(@viewed_user)
        # redirect username.host.ext => org-name.host.ext/u/username
        redirect_to CartoDB.base_url(@viewed_user.organization.name, @viewed_user.username) <<
                            CartoDB.path(self, 'public_user_feed_home') and return
      end

      description = @name.dup

      # TODO: move to helper
      if @maps_count == 0 && @tables_num == 0
        description << " uses CartoDB to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
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

        description << " · View #{@name} CartoDB profile for the latest activity and contribute to Open Data by creating an account in CartoDB"
      end

      @page_description = description

      respond_to do |format|
        format.html { render 'user_feed', layout: 'public_user_feed' }
      end
    end
  end

  def datasets_for_user(user)
    set_layout_vars_for_user(user, 'datasets')
    render_datasets(
      user_public_vis_list({
        user:  user,
        vis_type: Visualization::Member::TYPE_CANONICAL,
        per_page: DATASETS_PER_PAGE
      }), user
    )
  end

  def datasets_for_organization(org)
    set_layout_vars_for_organization(org, 'datasets')
    render_datasets(org.public_datasets(current_page, DATASETS_PER_PAGE, tag_or_nil))
  end

  def maps_for_user(user)
    set_layout_vars_for_user(user, 'maps')
    render_maps(
      user_public_vis_list({
        user:     user,
        vis_type: Visualization::Member::TYPE_DERIVED,
        per_page: MAPS_PER_PAGE,
      }), user
    )
  end

  def maps_for_organization(org)
    set_layout_vars_for_organization(org, 'maps')
    render_maps(org.public_visualizations(current_page, MAPS_PER_PAGE, tag_or_nil))
  end

  def render_not_found
    render_404
  end

  protected

  def eligible_for_redirect?(user)
    return false if CartoDB.subdomainless_urls?
    user.has_organization? && CartoDB.subdomain_from_request(request) != user.organization.name
  end

  def index_subdomainfull
    if current_user && current_viewer && current_user.id == current_viewer.id
      # username.cartodb.com should redirect to the user dashboard in the maps view if the user is logged in
      redirect_to CartoDB.url(self, 'dashboard')
    else
      # Asummes either current_user nil or at least different from current_viewer
      # username.cartodb.com should redirect to the public user feeds view if the username is not the user's username
      # username.cartodb.com should redirect to the public user feeds view if the user is not logged in
      redirect_to CartoDB.url(self, 'public_user_feed_home')
    end
  end

  def index_subdomainless
    if current_user && current_viewer && current_user.id == current_viewer.id
      redirect_to CartoDB.url(self, 'dashboard')
    elsif current_user.nil? && current_viewer
      # current_viewer always returns a user with a session
      redirect_to CartoDB.url(self, 'dashboard', {}, current_viewer)
    elsif CartoDB.username_from_request(request)
      redirect_to CartoDB.url(self, 'public_user_feed_home')
    else
      # We cannot get any user information from domain, path or session
      redirect_to CartoDB.url(self, 'login')
    end
  end

  def render_datasets(vis_list, user=nil)
    set_pagination_vars({
        total_count: vis_list.total_entries,
        per_page:    DATASETS_PER_PAGE,
        first_page_url: CartoDB.url(self, 'public_datasets_home', {}, user),
        numbered_page_url: CartoDB.url(self, 'public_datasets_home', {page: PAGE_NUMBER_PLACEHOLDER}, user)
      })

    @datasets = []

    vis_list.each do |vis|
      @datasets << process_dataset_render(vis)
    end

    @datasets.compact!

    description = @name.dup

    # TODO: move to helper
    if @datasets.size == 0
      description << " uses CartoDB to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
    else
      description << " has published #{@datasets.size} public #{'dataset'.pluralize(@datasets.size)}"
    end

    description << " · View #{@name} CartoDB profile for the latest activity and contribute to Open Data by creating an account in CartoDB"

    @page_description = description

    respond_to do |format|
      format.html { render 'public_datasets', layout: 'public_dashboard' }
    end
  end

  def render_maps(vis_list, user=nil)
    set_pagination_vars({
        total_count: vis_list.total_entries,
        per_page:    MAPS_PER_PAGE,
        first_page_url: CartoDB.url(self, 'public_maps_home', {}, user),
        numbered_page_url: CartoDB.url(self, 'public_maps_home', {page: PAGE_NUMBER_PLACEHOLDER}, user)
      })

    @visualizations = []
    vis_list.each do |vis|
      @visualizations << process_map_render(vis)
    end

    @visualizations.compact!

    description = @name.dup

    # TODO: move to helper
    if @visualizations.size == 0 && @tables_num == 0
      description << " uses CartoDB to transform location intelligence into dynamic renderings that enable discovery of trends and patterns"
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

      description << " · View #{@name} CartoDB profile for the latest activity and contribute to Open Data by creating an account in CartoDB"
    end

    @page_description = description

    respond_to do |format|
      format.html { render 'public_maps', layout: 'public_dashboard' }
    end
  end

  def set_layout_vars_for_user(user, content_type)
    set_layout_vars({
        most_viewed_vis_map: Visualization::Collection.new.fetch({
            user_id:        user.id,
            type:           Visualization::Member::TYPE_DERIVED,
            privacy:        Visualization::Member::PRIVACY_PUBLIC,
            order:          'mapviews',
            page:           1,
            per_page:       1,
            exclude_shared: true,
            exclude_raster: true
          }).first,
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
    set_layout_vars({
        most_viewed_vis_map: org.public_vis_by_type(Visualization::Member::TYPE_DERIVED, 1, 1, nil, 'mapviews').first,
        content_type:        content_type,
        default_fallback_basemap: org.owner ? org.owner.default_basemap : nil,
        base_url: ''
      })
    set_shared_layout_vars(org, {
        name:       org.display_name.blank? ? org.name : org.display_name,
        avatar_url: org.avatar_url,
      })
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
    @tables_num         = @is_org ? model.public_datasets_count : model.public_table_count
    @maps_count         = @is_org ? model.public_visualizations_count : model.public_visualization_count
  end

  def user_public_vis_list(required)
    Visualization::Collection.new.fetch({
      user_id:  required.fetch(:user).id,
      type:     required.fetch(:vis_type),
      per_page: required.fetch(:per_page),
      privacy:  Visualization::Member::PRIVACY_PUBLIC,
      page:     current_page,
      order:    'updated_at',
      o:        {updated_at: :desc},
      tags:     tag_or_nil,
      exclude_shared: true,
      exclude_raster: true,
    })
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
        source_html_safe: dataset.source_html_safe
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
      description_html_safe: vis.description_html_safe,
      tags:        vis.tags,
      updated_at:  vis.updated_at,
      owner:       vis.user,
      likes_count: vis.likes.count,
      map_zoom:    vis.map.zoom
    }
  end

  def get_viewed_user
    username = CartoDB.extract_subdomain(request)
    @viewed_user = ::User.where(username: username).first
  end


  def website_url(url)
    if url.blank?
      ""
    else
      !url.blank? && url[/^https?:\/\//].nil? ? "http://#{url}" : url
    end
  end

end
