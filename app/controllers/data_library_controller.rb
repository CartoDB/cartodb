# coding: UTF-8

class DataLibraryController < ApplicationController
  layout 'data_library'

  ssl_allowed :index, :search
  before_filter :get_viewed_user

  def index
    render_404 and return if @viewed_user.nil? || !@viewed_user.has_feature_flag?("data_library")

    @base_url = @viewed_user.public_url(nil, request.protocol == "https://" ? "https" : "http")

    respond_to do |format|
      format.html { render 'index' }
    end
  end

  private

  def get_viewed_user
    username = CartoDB.extract_subdomain(request).strip.downcase
    @viewed_user = User.where(username: username).first
  end
end
