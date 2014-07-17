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

  before_filter :login_required, :except => [:public, :datasets]
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

    @tags             = viewed_user.tags(true, Visualization::Member::CANONICAL_TYPE)
    @name             = viewed_user.name.present? ? viewed_user.name : viewed_user.username
    @twitter_username = viewed_user.twitter_username 
    @description      = viewed_user.description  
    @website          = viewed_user.website 
    @website_clean    = @website ? @website.gsub(/https?:\/\//, '') : ''

    @avatar_url = viewed_user.gravatar(request.protocol)

    #@tables_num = viewed_user.table_count(::Table::PRIVACY_PUBLIC)
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
      exclude_shared: true
    })

    @datasets = []
    @pages = (datasets.total_entries.to_f / DATASETS_PER_PAGE).ceil

    datasets.each do |dataset|
      @datasets.push(
        {
          title:        dataset.name,
          description:  dataset.description_clean,
          updated_at:   dataset.updated_at,
          tags:         dataset.tags
        }
      )
    end
    
    @tables_num = @datasets.size
    
    respond_to do |format|
      format.html { render 'datasets', layout: 'application_public_dashboard' }
    end

  end #datasets

  def public
    username = CartoDB.extract_subdomain(request)
    viewed_user = User.where(username: username.strip.downcase).first

    if viewed_user.nil?
      org = get_organization_if_exists(username)
      return public_organization(org) unless org.nil?
    end

    return render_404 if viewed_user.nil?

    @tags             = viewed_user.tags(true, Visualization::Member::DERIVED_TYPE)
    @name             = viewed_user.name.present? ? viewed_user.name : viewed_user.username
    @twitter_username = viewed_user.twitter_username 
    @description      = viewed_user.description
    @website          = !viewed_user.website.blank? && viewed_user.website[/^https?:\/\//].nil? ? "http://#{viewed_user.website}" : viewed_user.website
    @website_clean    = @website ? @website.gsub(/https?:\/\//, "") : ""

    @avatar_url = viewed_user.gravatar(request.protocol)

    @tables_num = viewed_user.table_count(::Table::PRIVACY_PUBLIC)
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
      exclude_shared: true
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
          url_options:  (vis.url_options.present? ? vis.url_options : Visualization::Member::DEFAULT_URL_OPTIONS)
        }
      )
    end

    respond_to do |format|
      format.html { render 'public', layout: 'application_public_dashboard' }
    end

  end #public

  private

  def public_organization(organization)
    @organization = organization

    @public_org_tables_count = @organization.public_datasets_count
    @public_org_vis_count = @organization.public_visualizations_count

    page = params[:page].nil? ? 1 : params[:page]
    vis_list = @organization.public_visualizations(page, VISUALIZATIONS_PER_PAGE, params[:tag])

    @pages = (vis_list.total_entries / VISUALIZATIONS_PER_PAGE).ceil

    @public_org_visualizations = []
    vis_list.each do |vis|
      @public_org_visualizations.push(
        {
          title:        vis.name,
          description:  vis.description_clean,
          id:           vis.id,
          tags:         vis.tags,
          layers:       vis.layers(:carto_and_torque),
          url_options:  (vis.url_options.present? ? vis.url_options : Visualization::Member::DEFAULT_URL_OPTIONS)
        }
      )
    end

    @tags = @organization.tags(Visualization::Member::DERIVED_TYPE)

    respond_to do |format|
      format.html { render 'public_organization', layout: 'application_public_organization_dashboard' }
    end
  end

  def datasets_organization(organization)
    @organization = organization

    @public_org_tables_count = @organization.public_datasets_count
    @public_org_vis_count = @organization.public_visualizations_count

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
          tags:         dataset.tags
        }
      )
    end

    @tags = @organization.tags(Visualization::Member::CANONICAL_TYPE)

    respond_to do |format|
      format.html { render 'datasets_organization', layout: 'application_public_organization_dashboard' }
    end
  end

  def get_organization_if_exists(name)
    Organization.where(name: name).first
  end

end
