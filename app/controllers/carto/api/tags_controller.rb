# encoding: utf-8

class Carto::Api::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    render_jsonp([])
  end

end
