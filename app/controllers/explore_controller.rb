# coding: UTF-8

class ExploreController < ApplicationController
  layout 'frontend'

  def index
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
