# coding: UTF-8

class Api::Json::MetaController < ApplicationController
  ssl_required :column_types

  skip_before_filter :app_host_required, :verify_authenticity_token

  before_filter :api_authorization_required

  def column_types
    respond_to do |format|
      format.json do
        render :json => CartoDB::TYPES.keys.map{|t| t.capitalize}.to_json,
               :callback => params[:callback]
      end
    end
  end

end