# coding: UTF-8

class Api::Json::TablesController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :destroy

  before_filter :load_table, :only => [:show, :update, :destroy]
  before_filter :set_start_time
  after_filter :record_query_threshold

  def index
    @tables = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? order by id DESC", current_user.id).all
    render :json => @tables.map{ |table|
              {
                :id => table.id,
                :name => table.name,
                :privacy => table_privacy_text(table),
                :tags => table[:tags_names],
                :schema => table.schema
              }
            }.to_json,
           :callback => params[:callback]
  end

  def create
    @table = Table.new
    @table.user_id = current_user.id
    @table.name = params[:name] if params[:name]
    if params[:file]
      @table.import_from_file = params[:file]
      if $progress[params["X-Progress-ID".to_sym]].nil?
        $progress[params["X-Progress-ID".to_sym]] = 0
      end
    end
    @table.importing_SRID = params[:srid] || CartoDB::SRID
    @table.force_schema   = params[:schema] if params[:schema]
    @table.the_geom_type  = params[:the_geom_type].downcase if params[:the_geom_type]
    if @table.valid? && @table.save
      render :json => { :id => @table.id, :name => @table.name, :schema => @table.schema }.to_json,
             :status => 200,
             :location => table_path(@table),
             :callback => params[:callback]
    else
      Rails.logger.info "============== Errors on table ====================="
      Rails.logger.info @table.errors.full_messages
      Rails.logger.info "===================================================="
      render :json => { :errors => @table.errors.full_messages }.to_json, :status => 400, :callback => params[:callback]
    end
  rescue => e
    Rails.logger.info "============== exception on tables#create ====================="
    Rails.logger.info "#{translate_error(e).to_json.inspect}"
    Rails.logger.info "==============================================================="
    render :json => translate_error(e).to_json,
           :status => 400, :callback => params[:callback] and return
  end

  def show
    render :json => {
              :id => @table.id,
              :name => @table.name,
              :privacy => table_privacy_text(@table),
              :tags => @table[:tags_names],
              :schema => @table.schema
            }.to_json,
           :callback => params[:callback]
  end

  def update
    @table = Table.filter(:user_id => current_user.id, :name => params[:id]).first
    @table.set_all(params)
    if params.keys.include?("latitude_column") && params.keys.include?("longitude_column")
      latitude_column = params[:latitude_column] == "nil" ? nil : params[:latitude_column].try(:to_sym)
      longitude_column = params[:longitude_column] == "nil" ? nil : params[:longitude_column].try(:to_sym)
      @table.georeference_from!(:latitude_column => latitude_column, :longitude_column => longitude_column)
    # elsif params.keys.include?("address_column")
    #   address_column = params[:address_column] == "nil" ? nil : params[:address_column]
    #   @table.set_address_column!(address_column)
    end
    @table.tags = params[:tags] if params[:tags]
    if @table.save
      @table = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                            from user_tables
                            where id=?",@table.id).first
      render :json => {
        :id => @table.id,
        :name => @table.name,
        :privacy => table_privacy_text(@table),
        :tags => @table[:tags_names],
        :schema => @table.schema
      }.to_json, :status => 200, :callback => params[:callback]
    else
      render :json => { :errors => @table.errors.full_messages}.to_json, :status => 400, :callback => params[:callback]
    end
  rescue => e
    Rails.logger.info "========== #{e.class.name} ==========="
    Rails.logger.info $!
    Rails.logger.info "======================================"
    render :json => { :errors => [translate_error(e.message.split("\n").first)] }.to_json,
           :status => 400, :callback => params[:callback] and return
  end

  def destroy
    @table = Table.fetch("select * from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", current_user.id, params[:id]).all.first
    raise RecordNotFound if @table.nil?
    @table.destroy
    render :nothing => true, :status => 200, :callback => params[:callback]
  end

  protected

  def load_table
    @table = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id order by tags.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", current_user.id, params[:id]).all.first
    raise RecordNotFound if @table.nil?
  end
  
  def record_query_threshold
    if response.ok?
      case action_name
        when "create"
          CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
        when "destroy"
          CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
      end
    end
  end

end