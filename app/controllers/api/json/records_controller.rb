# coding: UTF-8

class Api::Json::RecordsController < ApplicationController
  ssl_required :index


  skip_before_filter :verify_authenticity_token
  before_filter :api_authorization_required
  before_filter :load_table

  def index
    render :json => @table.records(params.slice(:page, :rows_per_page)).to_json,
           :callback => params[:callback]
  end

  protected

  def load_table
    @table = Table.filter(:user_id => current_user.id, :name => params[:table_id]).first
    raise RecordNotFound if @table.nil?
  end

end