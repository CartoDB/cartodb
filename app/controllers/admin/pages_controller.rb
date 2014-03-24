# coding: utf-8

class Admin::PagesController < ApplicationController
  ssl_required :common_data, :public

  before_filter :login_required, :except => :public
  skip_before_filter :browser_is_html5_compliant?, only: [:public]

  def get_avatar(email, size = 128)

    email  = email.strip.downcase
    digest = Digest::MD5.hexdigest(email)

    "http://www.gravatar.com/avatar/#{digest}?s=#{size}&d=http%3A%2F%2Fcartodb.s3.amazonaws.com%2Fstatic%2Fmap-avatar-03.png"

  end

  def public

    @tags = %w(biodiversity law contest MWC2013)

    @avatar_url = get_avatar("javierarce@gmail.com")

    @visualizations = [{
        :title =>  "Map of trips per day",
        :description => "To get a better sense of the trips Eric made...",
        :url => 'http://arce.cartodb.com/api/v2/viz/008cee18-a9c4-11e3-b86c-0e73339ffa50/viz.json',
        :tags => %w(biodiversity law contest MWC2013),
        :mapviews => "12,376"
      }, {
        :title =>  "Map of trips per day",
        :description => "To get a better sense of the trips Eric made...",
        :url => 'http://simonrogers.cartodb.com/api/v2/viz/74910048-aba8-11e3-8eee-0e10bcd91c2b/viz.json',
        :tags => %w(biodiversity law contest MWC2013),
        :mapviews => "12,376"
      }, {
        :title =>  "Map of trips per day",
        :description => "To get a better sense of the trips Eric made...",
        :url => 'http://arce.cartodb.com/api/v2/viz/008cee18-a9c4-11e3-b86c-0e73339ffa50/viz.json',
        :tags => %w(biodiversity law contest MWC2013),
        :mapviews => "12,376"
      }

    ]

    respond_to do |format|
      format.html { render 'public', layout: 'application_public' }
    end
  end
end
