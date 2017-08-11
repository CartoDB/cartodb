# coding: UTF-8

class StaticController < ApplicationController
  layout false

  ssl_allowed :index

  def index
    render :file => File.join(Rails.root, 'public/static/dashboard/index.html')
  end
end
