# coding: utf-8

class Api::Json::ColumnsController < Api::ApplicationController

  ssl_required :index, :create, :show, :update, :destroy

  before_filter :load_table, :set_start_time
  before_filter :read_privileges?, only: [:show]
  before_filter :write_privileges?, only: [:create, :update, :destroy]

  def index
    render_jsonp(@table.schema(:cartodb_types => true))
  end

  def show
    resp = @table.schema(:cartodb_types => true).select{|e| e[0] == params[:id].to_sym}.first.last
    render_jsonp({ :type => resp })
  rescue => e
    render_jsonp({:errors => "Column #{params[:id]} doesn't exist"}, 404) and return
  end

  def create
    @stats_aggregator.timing('columns.create') do

      begin
        render_jsonp(@table.add_column!(params.slice(:type, :name)))
      rescue => e
        errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
        render_jsonp({:errors => errors}, 400) and return
      end

    end
  end

  def update
    @stats_aggregator.timing('columns.update') do

      begin
        render_jsonp(@table.modify_column!(name: params[:id],
                                           type: params[:type],
                                           new_name: params[:new_name]))
      rescue => e  
        errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
        render_jsonp({:errors => errors}, 400) and return
      end

    end
  end

  def destroy
    @stats_aggregator.timing('columns.destroy') do

      begin
        @table.drop_column!(:name => params[:id])

        # disabled because cluster raise an error when the owner of the table
        # is not the current user (in MU)

        # table_schema = @table.owner.database_schema
        # Select the primary key name of the table. This is neccesary because if you change the name of the table
        # the primary key index name does not change, so only way is to find it again on the postgresql schema
        #sql="select conname from pg_constraint,pg_namespace, pg_class where pg_namespace.nspname='#{table_schema}'
              #and pg_class.relname='#{@table.name}'
              #and pg_class.oid=pg_constraint.conrelid
              #and pg_constraint.contype='p' limit 1"

        # key_name = current_user.run_pg_query(sql)[:rows][0][:conname]
        # Recompact table on disk
        #current_user.run_pg_query("CLUSTER #{@table.name} USING #{pkey_name}")

        head :no_content
      rescue => e
        errors = e.is_a?(CartoDB::InvalidType) ? [e.db_message] : [translate_error(e.message.split("\n").first)]
        render_jsonp({:errors => errors}, 400) and return
      end

    end
  end

  protected

  def load_table
    @table = Helpers::TableLocator.new.get_by_id_or_name(params[:table_id],current_user)
    raise RecordNotFound if @table.nil?
  end

  def write_privileges?
    head(401) unless current_user and @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
  end

  def read_privileges?
    head(401) unless current_user and @table.table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
  end
end
