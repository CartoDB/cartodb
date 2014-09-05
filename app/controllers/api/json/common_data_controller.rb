# encoding: utf-8

class Api::Json::CommonDataController < Api::ApplicationController
  ssl_required :index

  def index
    render_jsonp({ :visualizations => CommonData.new.datasets })
  end

end
