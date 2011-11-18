# coding: utf-8

class Api::Json::ColumnsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :delete

  before_filter :load_table, :set_start_time
  after_filter :record_query_threshold

  def index
    render_jsonp(@table.schema(:cartodb_types => true))
  end

  def create
    render_jsonp(@table.add_column!(params.slice(:type, :name)))
  rescue => e
    errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
    render_jsonp({:errors => errors}, 400) and return
  end

  def show
    resp = @table.schema(:cartodb_types => true).select{|e| e[0] == params[:id].to_sym}.first.last
    render_jsonp({ :type => resp })
  rescue => e
    render_jsonp({:errors => "Column #{params[:id]} doesn't exist"}, 404) and return
  end

  def update
    render_jsonp(@table.modify_column!(:name => params[:id], 
                                       :type => params[:type], 
                                       :old_name => params[:id], 
                                       :new_name => params[:new_name]))
  rescue => e
    errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
    render_jsonp({:errors => errors}, 400) and return
  end

  def delete
    @table.drop_column!(:name => params[:id])
    
    # Recompact table on disk
    current_user.run_query("CLUSTER #{@table.name} USING #{@table.name}_pkey")
    
    head :ok
  rescue => e
    errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
    render_jsonp({:errors => errors}, 400) and return
  end



  protected

  def load_table
    @table = Table.filter(:user_id => current_user.id, :name => params[:table_id]).first
    raise RecordNotFound if @table.nil?
  end
  
  def record_query_threshold
    if response.ok?
      case action_name
        when "create", "update", "delete"
          CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
      end
    end
  end
end