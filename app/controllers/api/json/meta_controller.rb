# coding: UTF-8

class Api::Json::MetaController < Api::ApplicationController
  ssl_required :column_types

  def column_types
    respond_to do |format|
      format.json do
        render :json => CartoDB::TYPES.keys.map{|t| t.capitalize}.to_json,
               :callback => params[:callback]
      end
    end
  end

end