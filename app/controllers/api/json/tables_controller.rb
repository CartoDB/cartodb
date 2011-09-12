# coding: UTF-8

class Api::Json::TablesController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :destroy, :infowindow

  before_filter :load_table, :only => [:show, :update, :destroy, :infowindow]
  before_filter :set_start_time
  after_filter :record_query_threshold

  def index
    limit  = params[:per_page].nil? || params[:per_page].to_i > 100 ? 100 : params[:per_page].to_i
    offset = params[:page].nil? || params[:page].to_i < 0 ? 0 : limit*(params[:page].to_i - 1)
    @tables = if !params[:tag_name].blank?
      tag_name = params[:tag_name].sanitize.tr('_',' ')
      tables_count = Table.fetch("select count(user_tables.id) as count
                          from user_tables, tags
                          where user_tables.user_id = ? 
                            and user_tables.id = tags.table_id
                            and tags.name = ?", current_user.id, tag_name).first[:count]
      Table.fetch("select user_tables.*, 
                      array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables, tags
                          where user_tables.user_id = ? 
                            and user_tables.id = tags.table_id
                            and tags.name = ?
                          order by user_tables.id DESC 
                          limit ? offset ?", current_user.id, tag_name, limit, offset).all      
    else
      Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? order by id DESC
                          limit ? offset ?", current_user.id, limit, offset).all
    end
    render :json => {
      :total_entries => params[:tag_name] ? tables_count : current_user.tables_count,
      :tables => @tables.map{ |table|
              {
                :id => table.id,
                :name => table.name,
                :privacy => table_privacy_text(table),
                :tags => table[:tags_names],
                :schema => table.schema,
                :updated_at => table.updated_at,
                :rows_counted => table.rows_counted
              }
            }
      }.to_json,
      :callback => params[:callback]
  end

  def create
    @table = Table.new
    @table.user_id = current_user.id
    @table.name = params[:name]                    if params[:name]
    @table.import_from_file = params[:file]        if params[:file]
    @table.importing_SRID = params[:srid] || CartoDB::SRID
    @table.force_schema   = params[:schema]        if params[:schema]
    @table.the_geom_type  = params[:the_geom_type] if params[:the_geom_type]
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
    Rails.logger.info "#{translate_error(e).inspect}"
    Rails.logger.info "==============================================================="
    render :json => translate_error(e),
           :status => 400, :callback => params[:callback] and return
  end

  def show
    respond_to do |format|
      format.csv do
        send_data @table.to_csv,
          :type => 'application/zip; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.shp do
        send_data @table.to_shp,
          :type => 'application/octet-stream; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.zip"
      end
      format.json do
        render :json => {
                  :id => @table.id,
                  :name => @table.name,
                  :privacy => table_privacy_text(@table),
                  :tags => @table[:tags_names],
                  :schema => @table.schema(:reload => true)
                }.to_json,
               :callback => params[:callback]
      end
    end
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

  # expects the infowindow data in the infowindow parameter
  def set_infowindow
    puts params
    @table.infowindow = params[:infowindow]
    render :nothing => true, :status => 200, :callback => params[:callback]
  end

  protected

  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:id])
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