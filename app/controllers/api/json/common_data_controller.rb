# encoding: utf-8
require_relative '../../../models/common_data'

class Api::Json::CommonDataController < Api::ApplicationController
  ssl_required :index

  def index
    render_jsonp({ :visualizations => CommonDataSingleton.instance.datasets })
  end

end
