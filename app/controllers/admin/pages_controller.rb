# encoding: utf-8

require_relative '../../models/table'
require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'

class Admin::PagesController < ApplicationController
  include CartoDB

  DATASETS_PER_PAGE = 10
  VISUALIZATIONS_PER_PAGE = 5
  USER_TAGS_LIMIT = 100

  ssl_required :common_data, :public, :datasets

  before_filter :login_required, :except => [:public, :datasets, :sitemap]
  before_filter :belongs_to_organization
  skip_before_filter :browser_is_html5_compliant?, only: [:public, :datasets]
  skip_before_filter :ensure_user_organization_valid, only: [:public]

  def datasets

    user = CartoDB.extract_subdomain(request)
    viewed_user = User.where(username: user.strip.downcase).first

    if viewed_user.nil?
      org = get_organization_if_exists(user)
      return datasets_organization(org) unless org.nil?
    end

    return render_404 if viewed_user.nil?

    # Redirect to org url if has only user
    if viewed_user.has_organization?
      if CartoDB.extract_real_subdomain(request) != viewed_user.organization.name
        redirect_to CartoDB.base_url(viewed_user.organization.name) <<  \
          public_datasets_home_path(user_domain: viewed_user.username) and return
      end
    end

    @tags               = viewed_user.tags(true, Visualization::Member::CANONICAL_TYPE)
    @username           = viewed_user.username
    @name               = viewed_user.name.present? ? viewed_user.name : viewed_user.username
    @available_for_hire = viewed_user.available_for_hire
    @email              = viewed_user.email
    @twitter_username   = viewed_user.twitter_username 
    @description        = viewed_user.description  
    @website            = viewed_user.website 
    @website_clean      = @website ? @website.gsub(/https?:\/\//, '') : ''

    @avatar_url = viewed_user.avatar

    @tables_num = viewed_user.public_table_count
    @vis_num    = viewed_user.public_visualization_count

    datasets = Visualization::Collection.new.fetch({
      user_id:  viewed_user.id,
      type:     Visualization::Member::CANONICAL_TYPE,
      privacy:  Visualization::Member::PRIVACY_PUBLIC,
      page:     params[:page].nil? ? 1 : params[:page],
      per_page: DATASETS_PER_PAGE,
      order:    'updated_at',
      o:        {updated_at: :desc},
      tags:     params[:tag],
      exclude_shared: true,
      exclude_raster: true
    })

    @datasets = []
    @pages = (datasets.total_entries.to_f / DATASETS_PER_PAGE).ceil

    datasets.each do |dataset|
      @datasets.push(
        {
          title:        dataset.name,
          description:  dataset.description_clean,
          updated_at:   dataset.updated_at,
          owner:        dataset.user,
          tags:         dataset.tags
        }
      )
    end
    
    respond_to do |format|
      format.html { render 'public_datasets', layout: 'application_public_dashboard' }
    end

  end #datasets

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
      if viewed_user.has_organization?
        if CartoDB.extract_real_subdomain(request) != viewed_user.organization.name
          redirect_to CartoDB.base_url(viewed_user.organization.name) <<  public_sitemap_pathand and return
        end
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

    @urls = visualizations.collect{|vis|
      if vis.type == Visualization::Member::DERIVED_TYPE
        {
          loc: public_visualizations_public_map_url(user_domain: params[:user_domain], id: vis[:id]),
          lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
        }
      elsif vis.type == Visualization::Member::CANONICAL_TYPE
        {
          loc: public_table_url(user_domain: params[:user_domain], id: vis.name),
          lastfreq: vis.updated_at.strftime("%Y-%m-%dT%H:%M:%S%:z")
        }
      end
    }
    render :formats => [:xml]
  end #sitemap

  def public
    username = CartoDB.extract_subdomain(request)
    viewed_user = User.where(username: username.strip.downcase).first

    if viewed_user.nil?
      org = get_organization_if_exists(username)
      return public_organization(org) unless org.nil?
    end

    return render_404 if viewed_user.nil?

    # Redirect to org url if has only user
    if viewed_user.has_organization?
      if CartoDB.extract_real_subdomain(request) != viewed_user.organization.name
        redirect_to CartoDB.base_url(viewed_user.organization.name) << "/u/#{viewed_user.username}/" and return
      end
    end

    @tags               = viewed_user.tags(true, Visualization::Member::DERIVED_TYPE)
    @username           = viewed_user.username
    @name               = viewed_user.name.present? ? viewed_user.name : viewed_user.username
    @twitter_username   = viewed_user.twitter_username 
    @available_for_hire = viewed_user.available_for_hire
    @email              = viewed_user.email
    @description        = viewed_user.description
    @website            = !viewed_user.website.blank? && viewed_user.website[/^https?:\/\//].nil? ? "http://#{viewed_user.website}" : viewed_user.website
    @website_clean      = @website ? @website.gsub(/https?:\/\//, "") : ""

    @avatar_url = viewed_user.avatar

    @tables_num = viewed_user.public_table_count
    @vis_num    = viewed_user.public_visualization_count

    visualizations = Visualization::Collection.new.fetch({
      user_id:  viewed_user.id,
      type:     Visualization::Member::DERIVED_TYPE,
      privacy:  Visualization::Member::PRIVACY_PUBLIC,
      page:     params[:page].nil? ? 1 : params[:page],
      per_page: VISUALIZATIONS_PER_PAGE,
      order:    'updated_at',
      o:        {updated_at: :desc},
      tags:     params[:tag],
      exclude_shared: true,
      exclude_raster: true
    })

    @visualizations = []
    @pages = (visualizations.total_entries.to_f / VISUALIZATIONS_PER_PAGE).ceil

    visualizations.each do |vis|
      @visualizations.push(
        {
          title:        vis.name,
          description:  vis.description_clean,
          id:           vis.id,
          tags:         vis.tags,
          layers:       vis.layers(:carto_and_torque),
          mapviews:     vis.stats.values.reduce(:+), # Sum last 30 days stats, for now only approach
          url_options:  (vis.url_options.present? ? vis.url_options : Visualization::Member::DEFAULT_URL_OPTIONS),
          owner:        vis.user
        }
      )
    end

    respond_to do |format|
      format.html { render 'public_dashboard', layout: 'application_public_dashboard' }
    end

  end #public

  private

  def public_organization(organization)
    @organization = organization

    @name = ( !@organization.display_name.empty? ? @organization.display_name : @organization.name )
    @avatar_url = @organization.avatar_url

    @twitter_username = @organization.twitter_username 
    @description      = @organization.description
    @website          = !@organization.website.blank? && @organization.website[/^https?:\/\//].nil? ? "http://#{@organization.website}" : @organization.website
    @website_clean    = @website ? @website.gsub(/https?:\/\//, "") : ""

    @tables_num = @organization.public_datasets_count
    @vis_num = @organization.public_visualizations_count

    page = params[:page].nil? ? 1 : params[:page]
    vis_list = @organization.public_visualizations(page, VISUALIZATIONS_PER_PAGE, params[:tag])

    @pages = (vis_list.total_entries / VISUALIZATIONS_PER_PAGE).ceil

    @visualizations = []
    vis_list.each do |vis|
      @visualizations.push(
        {
          title:        vis.name,
          description:  vis.description_clean,
          id:           vis.id,
          tags:         vis.tags,
          layers:       vis.layers(:carto_and_torque),
          url_options:  (vis.url_options.present? ? vis.url_options : Visualization::Member::DEFAULT_URL_OPTIONS),
          owner:        vis.user
        }
      )
    end

    @tags = @organization.tags(Visualization::Member::DERIVED_TYPE)

    respond_to do |format|
      format.html { render 'public_dashboard', layout: 'application_public_dashboard' }
    end
  end

  def datasets_organization(organization)
    @organization = organization

    @twitter_username = @organization.twitter_username 
    @description      = @organization.description
    @website          = !@organization.website.blank? && @organization.website[/^https?:\/\//].nil? ? "http://#{@organization.website}" : @organization.website
    @website_clean    = @website ? @website.gsub(/https?:\/\//, "") : ""

    @tables_num = @organization.public_datasets_count
    @vis_num = @organization.public_visualizations_count

    page = params[:page].nil? ? 1 : params[:page]
    vis_list = @organization.public_datasets(page, DATASETS_PER_PAGE, params[:tag])

    @pages = (vis_list.total_entries.to_f / DATASETS_PER_PAGE).ceil

    @datasets = []
    vis_list.each do |dataset|
      @datasets.push(
        {
          title:        dataset.name,
          description:  dataset.description_clean,
          updated_at:   dataset.updated_at,
          tags:         dataset.tags,
          owner:        dataset.user
        }
      )
    end

    @tags = @organization.tags(Visualization::Member::CANONICAL_TYPE)

    respond_to do |format|
      format.html { render 'public_datasets', layout: 'application_public_dashboard' }
    end
  end

  def get_organization_if_exists(name)
    Organization.where(name: name).first
  end

  def belongs_to_organization
    user_or_org_domain = CartoDB.extract_real_subdomain(request)
    user_domain = CartoDB.extract_subdomain(request)
    user = User.where(username: user_domain).first

    unless user.nil?
      if user.username != user_or_org_domain and not user.belongs_to_organization?(Organization.where(name: user_or_org_domain).first)
        render_404
      end
    end
  end

end
