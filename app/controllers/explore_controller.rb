# coding: UTF-8

class ExploreController < ApplicationController
  layout 'explore'

  def index
    username = CartoDB.extract_subdomain(request).strip.downcase
    @viewed_user = User.where(username: username).first
    render_404 and return if @viewed_user.nil? || !@viewed_user.has_feature_flag?("explore_site")
    @default_fallback_basemap = @viewed_user.default_basemap

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  def search
    username = CartoDB.extract_subdomain(request).strip.downcase
    @viewed_user = User.where(username: username).first
    render_404 and return if @viewed_user.nil? || !@viewed_user.has_feature_flag?("explore_site")
    @query_param = params[:q]
    respond_to do |format|
      format.html { render 'search' }
    end
  end
end
