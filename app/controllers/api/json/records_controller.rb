# encoding: UTF-8

require_relative '../../../models/visualization/member'

class Api::Json::RecordsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :destroy

  REJECT_PARAMS = %W{ format controller action row_id requestId column_id
  api_key table_id oauth_token oauth_token_secret api_key user_domain }

  before_filter :load_table, :set_start_time
  before_filter :read_privileges?, only: [:show]
  before_filter :write_privileges?, only: [:create, :update, :destroy]

  def create
    primary_key = @table.insert_row!(params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
    render_jsonp(get_record(primary_key))
  rescue => e
    render_jsonp({ :errors => [e.message] }, 400)
  end

  def show
    render_jsonp(get_record(params[:id]))
  rescue => e
    render_jsonp({ :errors => ["Record #{params[:id]} not found"] }, 404)
  end

  def update
    return(head 401) unless @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
    unless params[:id].blank?
      begin
        resp = @table.update_row!(params[:id], params.reject{|k,v| REJECT_PARAMS.include?(k)}.symbolize_keys)
        if resp > 0
          render_jsonp(get_record(params[:id]))
        else
          render_jsonp({ :errors => ["row identified with #{params[:id]} not found"] }, 404) and return
        end
      rescue => e
        CartoDB::Logger.info e.backtrace.join('\n')
        render_jsonp({ :errors => [translate_error(e.message.split("\n").first)] }, 400) and return
      end
    else
      render_jsonp({ :errors => ["id can't be blank"] }, 404) and return
    end
  end

  def destroy
    return(head 401) unless @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)

    id = (params[:id] =~ /\A\d+\z/ ? params[:id] : params[:id].to_s.split(','))
    schema_name = current_user.database_schema
    if current_user.id != @table.owner.id
      schema_name = @table.owner.database_schema
    end
    current_user.in_database.select.from(@table.name.to_sym.qualify(schema_name.to_sym)).where(cartodb_id: id).delete
    head :no_content
  rescue => e
    render_jsonp({ errors: ["row identified with #{params[:id]} not found"] }, 404)
  end

  protected

  def get_record(id)
    @table.record(id)
  end

  def load_table
    @table = Helpers::TableLocator.new.get_by_id_or_name(params[:table_id], current_user)
    raise RecordNotFound if @table.nil?
  end

  def write_privileges?
    head(401) unless current_user and @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
  end

  def read_privileges?
    head(401) unless current_user and @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
  end
end
