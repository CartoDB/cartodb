# coding: UTF-8

class Api::Json::ColumnsController < ApplicationController
  ssl_required :index

  skip_before_filter :verify_authenticity_token
  before_filter :api_authorization_required
  before_filter :load_table

  def index
    render :json => @table.schema(:cartodb_types => true).to_json,
           :callback => params[:callback]
  end

  def create
    resp = @table.add_column!(params.slice(:type, :name))
    render :json => resp.to_json, :status => 200, :callback => params[:callback]
  rescue => e
    errors = if e.is_a?(CartoDB::InvalidType)
      [e.db_message]
    else
      [translate_error(e.message.split("\n").first)]
    end
    render :json => { :errors => errors }.to_json, :status => 400,
           :callback => params[:callback] and return
  end

  def show
    render :json => {:type => @table.schema(:cartodb_types => true).
                    select{|e| e[0] == params[:id].to_sym}.
                    first.last}.to_json,
           :callback => params[:callback]
  rescue
    render :json => { :errors => "Column #{params[:id]} doesn't exist" }.to_json, :status => 404,
           :callback => params[:callback] and return
  end

  def update
    resp = @table.modify_column!(:name => params[:id], :type => params[:type], :old_name => params[:id], :new_name => params[:new_name])
    render :json => resp.to_json, :status => 200, :callback => params[:callback]
  rescue => e
    errors = if e.is_a?(CartoDB::InvalidType)
      [e.db_message]
    else
      [translate_error(e.message.split("\n").first)]
    end
    render :json => { :errors => errors }.to_json, :status => 400,
           :callback => params[:callback] and return
  end

  def delete
    @table.drop_column!(:name => params[:id])
    render :nothing => true, :status => 200, :callback => params[:callback]
  rescue => e
    errors = if e.is_a?(CartoDB::InvalidType)
      [e.db_message]
    else
      [translate_error(e.message.split("\n").first)]
    end
    render :json => { :errors => errors }.to_json, :status => 400,
           :callback => params[:callback] and return
  end

  protected

  def load_table
    @table = Table.filter(:user_id => current_user.id, :name => params[:table_id]).first
    raise RecordNotFound if @table.nil?
  end

end