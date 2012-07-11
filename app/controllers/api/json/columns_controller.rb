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
    
    # Select the primary key name of the table. This is neccesary because if you change the name of the table
    # the primary key index name does not change, so only way is to find it again on the postgresql schema
    sql="select conname from pg_constraint,pg_namespace, pg_class where pg_namespace.nspname='public'
          and pg_class.relname='#{@table.name}'
          and pg_class.oid=pg_constraint.conrelid
          and pg_constraint.contype='p' limit 1"
    
    pkey_name = current_user.run_query(sql)[:rows][0][:conname]
    # Recompact table on disk
    current_user.run_query("CLUSTER #{@table.name} USING #{pkey_name}")
    
    head :ok
  rescue => e
    errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
    render_jsonp({:errors => errors}, 400) and return
  end



  protected

  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:table_id])
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
