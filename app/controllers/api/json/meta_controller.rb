# coding: UTF-8

class Api::Json::MetaController < ApplicationController

  skip_before_filter :verify_authenticity_token

  before_filter :api_authorization_required

  def column_types
    respond_to do |format|
      format.json do
        render :json => %W{ String Number Date }.to_json,
               :callback => params[:callback]
      end
    end
  end

end