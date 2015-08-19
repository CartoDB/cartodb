# encoding: utf-8
require_relative '../../../models/common_data'

class Api::Json::CommonDataController < Api::ApplicationController
  ssl_required :index

  def index
    common_data_user = Carto::User.where(username: Cartodb.config[:common_data]['username']).first
    visualizations_api_url = CartoDB.url(self, 'api_v1_visualizations_index', {type: 'table', privacy: 'public'}, common_data_user)
    render_jsonp(CommonDataSingleton.instance.datasets(visualizations_api_url))
  end

end
