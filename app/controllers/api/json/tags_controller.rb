# coding: UTF-8

class Api::Json::TagsController < Api::ApplicationController
  ssl_required :index

  def index
    limit = params[:limit].nil? ? 10 : params[:limit].to_i    
    render_jsonp(Tag.load_user_tags(current_user.id, :limit => limit))
  end
end
