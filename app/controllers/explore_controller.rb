# coding: UTF-8

class ExploreController < ApplicationController
  layout 'explore'

  def index
    username = CartoDB.extract_subdomain(request).strip.downcase
    @viewed_user = User.where(username: username).first
    @default_fallback_basemap = @viewed_user.default_basemap

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  def search
    query_param = params[:q]
    respond_to do |format|
      format.html { render 'search' }
    end
  end
end
