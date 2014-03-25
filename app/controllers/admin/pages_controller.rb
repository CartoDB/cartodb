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

    @tags       = current_user.tags

    @username   = current_user.username
    @avatar_url = get_avatar(current_user.email)

    @tables_num = current_user.tables.count
    @vis_num    = current_user.visualization_count

    page_num = 1

    visualizations = Visualization::Collection.new.fetch({
      map_id:   current_user.maps.map(&:id),
      type:     Visualization::Member::DERIVED_TYPE,
      page:     page_num,
      per_page: VISUALIZATIONS_PER_PAGE,
      order:    'created_at',
      o:        {created_at: :desc}
    })

    @visualizations = []
    @pages = (visualizations.total_entries.to_f / VISUALIZATIONS_PER_PAGE).ceil

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
