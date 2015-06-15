# encoding: utf-8

require_relative '../../models/table'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'

class Admin::PagesController < ApplicationController

  include CartoDB

  DATASETS_PER_PAGE = 20
  MAPS_PER_PAGE = 9
  USER_TAGS_LIMIT = 100
  PAGE_NUMBER_PLACEHOLDER = 'PAGENUMBERPLACEHOLDER'

  ssl_required :common_data, :public, :datasets
  ssl_allowed :index, :sitemap, :datasets_for_user, :datasets_for_organization, :maps_for_user, :maps_for_organization,
              :render_not_found

  before_filter :login_required, :except => [:public, :datasets, :sitemap, :index]
  before_filter :ensure_organization_correct
  skip_before_filter :browser_is_html5_compliant?, only: [:public, :datasets]
  skip_before_filter :ensure_user_organization_valid, only: [:public]


  # Just an entrypoint to dispatch to different places according to
  def index
    CartoDB.subdomainless_urls? ? index_subdomainless : index_subdomainfull
  end

  def common_data
    redirect_to CartoDB.url(self, 'datasets_library')
  end

  def sitemap
    username = CartoDB.extract_subdomain(request)
    viewed_user = User.where(username: username.strip.downcase).first

    if viewed_user.nil?
      org = get_organization_if_exists(username)
      return if org.nil?
      visualizations = (org.public_visualizations.to_a || [])
      visualizations += (org.public_datasets.to_a || [])
    else
      # Redirect to org url if has only user
      if eligible_for_redirect?(viewed_user)
        redirect_to CartoDB.base_url(viewed_user.organization.name) << CartoDB.path(self, 'public_sitemap') and return
      end

      visualizations = Visualization::Collection.new.fetch({
        user_id:  viewed_user.id,
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

  def public
    maps = CartoDB::ControllerFlows::Public::Maps.new(self)
    content = CartoDB::ControllerFlows::Public::Content.new(self, request, maps)
    content.render()
  end

  def datasets_for_user(user)
    set_layout_vars_for_user(user, 'datasets')
    render_datasets(
      user_public_vis_list({
        user:  user,
        vis_type: Visualization::Member::TYPE_CANONICAL,
        per_page: DATASETS_PER_PAGE,
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
      # username.cartodb.com should redirect to the public user dashboard in the maps view if the username is not the user's username
      # username.cartodb.com should redirect to the public user dashboard in the maps view if the user is not logged in
      redirect_to CartoDB.url(self, 'public_maps_home')
    end
  end

  def index_subdomainless
    if current_user && current_viewer && current_user.id == current_viewer.id
      redirect_to CartoDB.url(self, 'dashboard')
    elsif current_user.nil? && current_viewer
      # current_viewer always returns a user with a session
      redirect_to CartoDB.url(self, 'dashboard', {}, current_viewer)
    elsif CartoDB.username_from_request(request)
      redirect_to CartoDB.url(self, 'public_maps_home')
    else
      # We cannot get any user information from domain, path or session
      redirect_to login_url
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
    # TODO logic as done client-side, how and where to encapsulate this better?
    geometry_mapping = {
      'st_multipolygon'    => 'polygon',
      'st_polygon'         => 'polygon',
      'st_multilinestring' => 'line',
      'st_linestring'      => 'line',
      'st_multipoint'      => 'point',
      'st_point'           => 'point'
    }

    vis_list.each do |vis|
      geometry_type = vis.kind
      if geometry_type != 'raster'
        table_geometry_types = vis.table.geometry_types
        geometry_type = table_geometry_types.first.present? ? geometry_mapping.fetch(table_geometry_types.first.downcase, '') : ''
      end

      @datasets << vis_item(vis).merge({
          rows_count:    vis.table.rows_counted,
          size_in_bytes: vis.table.table_size,
          geometry_type: geometry_type,
        })
    end

    description = "#{@name} has"

    # TODO: move to helper
    if @datasets.size == 0
      description << " not published any public dataset yet"
    else
      description << " published #{@datasets.size} public dataset#{@datasets.size == 1 ? "" : "s"}"
    end

    description << " · Contribute to Open Data by creating an account in CartoDB"

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
      @visualizations << vis_item(vis)
    end

    description = "#{@name} has"

    # TODO: move to helper
    if @visualizations.size == 0 && @tables_num == 0
      description << " not published any public dataset or map yet"
    else
      unless @visualizations.size == 0
        description << " created #{@visualizations.size} map#{@visualizations.size == 1 ? "" : "s"}"
      end

      unless @visualizations.size == 0 || @tables_num == 0
        description << " and"
      end

      unless @tables_num == 0
        description << " published #{@tables_num} public dataset#{@tables_num == 1 ? "" : "s"}"
      end

      description << " · Contribute to Open Data by creating an account in CartoDB"
    end

    @page_description = description

    respond_to do |format|
      format.html { render 'public_maps', layout: 'public_dashboard' }
    end
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
      map_zoom:    1 #vis.map.zoom
    }
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
        user: user
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
        default_fallback_basemap: org.owner.default_basemap
      })
    set_shared_layout_vars(org, {
        name:       org.display_name.blank? ? org.name : org.display_name,
        avatar_url: org.avatar_url,
      })
  end

  def set_layout_vars(required)
    @most_viewed_vis_map = required.fetch(:most_viewed_vis_map)
    @content_type        = required.fetch(:content_type)
    @maps_url            = CartoDB.url(view_context, 'public_visualizations_home', {}, required.fetch(:user, nil))
    @datasets_url        = CartoDB.url(view_context, 'public_datasets_home', {}, required.fetch(:user, nil))
    @default_fallback_basemap = required.fetch(:default_fallback_basemap, {})
  end

  def set_pagination_vars(required)
    @total_count  = required.fetch(:total_count)
    @per_page     = required.fetch(:per_page)
    @current_page = current_page
    @first_page_url = required.fetch(:first_page_url)
    @numbered_page_url = required.fetch(:numbered_page_url)
    @page_number_placeholder = PAGE_NUMBER_PLACEHOLDER
  end

  # Shared as in shared for both new and old layout
  def set_shared_layout_vars(model, required, optional = {})
    @twitter_username   = model.twitter_username
    @description        = model.description
    @website            = !model.website.blank? && model.website[/^https?:\/\//].nil? ? "http://#{model.website}" : model.website
    @website_clean      = @website ? @website.gsub(/https?:\/\//, "") : ""
    @name               = required.fetch(:name)
    @avatar_url         = required.fetch(:avatar_url)
    @email              = optional.fetch(:email, nil)
    @available_for_hire = optional.fetch(:available_for_hire, false)
    @user = optional.fetch(:user, nil)
    @tables_num         = (model.is_a? Organization) ? model.public_datasets_count : model.public_table_count
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
    user = User.where(username: user_domain).first

    unless user.nil?
      if user.username != user_or_org_domain and not user.belongs_to_organization?(get_organization_if_exists(user_or_org_domain))
        render_404
      end
    end
  end

end
