# coding: utf-8

require_relative '../../models/visualization/member'
require_relative '../../models/visualization/collection'

class Admin::PagesController < ApplicationController
  include CartoDB

  VISUALIZATIONS_PER_PAGE = 3
  USER_TAGS_LIMIT = 100

  ssl_required :common_data, :public

  before_filter :login_required, :except => :public
  skip_before_filter :browser_is_html5_compliant?, only: [:public]

  def get_avatar(email, size = 128)

    email  = email.strip.downcase
    digest = Digest::MD5.hexdigest(email)

    "http://www.gravatar.com/avatar/#{digest}?s=#{size}&d=http%3A%2F%2Fcartodb.s3.amazonaws.com%2Fstatic%2Fmap-avatar-03.png"

  end

  def public
    user = CartoDB.extract_subdomain(request)
    viewed_user = User.where(username: user.strip.downcase).first
    render_404 if viewed_user.nil?

    @tags = viewed_user.tags

    @username   = viewed_user.username
    @avatar_url = get_avatar(viewed_user.email)

    @tables_num = viewed_user.tables.count
    @vis_num    = viewed_user.visualization_count

    #TODO: Paginate according to some parameter setn by the frontend/JS
    page_num = 1

    visualizations = Visualization::Collection.new.fetch({
      map_id:   viewed_user.maps.map(&:id),
      type:     Visualization::Member::DERIVED_TYPE,
      page:     page_num,
      per_page: VISUALIZATIONS_PER_PAGE,
      order:    'created_at',
      o:        {created_at: :desc}
    })

    @visualizations = []
    visualizations.each do |vis|
      @visualizations.push(
        {
          title:        vis.name,
          description:  vis.description,
          id:           vis.id,
          tags:         vis.tags,
          mapviews:     vis.stats.values.reduce(:+) # Sum last 30 days stats, for now only approach
        }
      )
    end

    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end
end
