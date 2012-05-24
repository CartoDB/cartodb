# coding: UTF-8

class Api::Json::TablesController < Api::ApplicationController
  ssl_required :index, :show, :create, :update, :destroy, :set_infowindow, :duplicate, :set_map_metadata, :get_map_metadata

  before_filter :load_table, :except => [:index, :create]
  before_filter :set_start_time
  after_filter  :record_query_threshold

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
    
    render_jsonp({ :total_entries => params[:tag_name] ? tables_count : current_user.tables_count,
                    :tables => @tables.map { |table|
                        { :id => table.id,            
                          :name => table.name,
                          :privacy => table_privacy_text(table),
                          :tags => table[:tags_names],
                          :schema => table.schema,
                          :updated_at => table.updated_at,
                          :rows_counted => table.rows_estimated }
                      }
                    })
  end

  def create
    @data_import = DataImport.new(:user_id => current_user.id)
    @data_import.updated_at = Time.now
    @data_import.save
    
    #get info about any import data coming
    multifiles = ['.bz2','.osm']
    if params[:url] || params[:file]
      src = params[:file] ? params[:file] : params[:url]
      suggested_name = nil
      ext = nil
      if src =~ /openstreetmap.org/
        if src !~ /api.openstreetmap.org/
          src = fix_openstreetmap_url src
          
          @data_import.log_update("Openstreetmaps.org URL converted to API url")
          @data_import.log_update(src)
        end
        suggested_name = "osm_export"
        ext = ".osm"
      else
        ext =File.extname(src)
      end
    end
    
    if ext.present? and multifiles.include?(ext)
      # Handle OSM imports allowing multi-table creation
      begin
        owner = User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
        hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          "database" => owner.database_name, 
          :logger => ::Rails.logger,
          "username" => owner.database_username, 
          "password" => owner.database_password,
          :import_from_file => src,
          :suggested_name => suggested_name,
          :debug => (Rails.env.development?), 
          :remaining_quota => owner.remaining_quota,
          :data_import_id => @data_import.id
        ).symbolize_keys
    
        importer = CartoDB::Importer.new hash_in
        importer = importer.import!
        render_jsonp({:tag => importer.tag }, 200, :location => '/dashboard')
      rescue => e
        @data_import.refresh
        @data_import.log_error(e)
        @data_import.set_error_code(6000)
        raise "OSM data error"
      end
    elsif params[:append].present?
      #handle table appending. table appending doesn't work with OSM files, so after the multi check
      @new_table = Table.new
      
      @data_import = DataImport.new(:user_id => current_user.id)
      @data_import.updated_at = Time.now
      @data_import.save
      
      @new_table.user_id = current_user.id
      @new_table.data_import_id = @data_import.id
      @new_table.name = params[:name]                          if params[:name]# && !params[:table_copy]
      @new_table.import_from_file = params[:file]              if params[:file]
      @new_table.import_from_url = params[:url]                if params[:url]
      @new_table.save
      #if @new_table.valid? && @new_table.save      
        @new_table.reload
        @table = Table.filter(:user_id => current_user.id, :id => params[:table_id]).first
        @table.append_to_table(:from_table => @new_table)
        @table.save.reload
      #   # append_to_table doesn't automatically destroy the table
        @new_table.destroy
      
        render_jsonp({:id => @table.id, 
                     :name => @table.name, 
                     :schema => @table.schema}, 200, :location => table_path(@table))
    else
      @table = Table.new
      @table.user_id = current_user.id
      @table.data_import_id = @data_import.id
      @table.name = params[:name]                          if params[:name]# && !params[:table_copy]
      @table.import_from_file = params[:file]              if params[:file]
      @table.import_from_url = params[:url]                if params[:url]
      @table.import_from_table_copy = params[:table_copy]  if params[:table_copy]
      @table.import_from_query = params[:from_query]  if params[:from_query]   
      @table.migrate_existing_table = params[:migrate_table]  if params[:migrate_table]    
      @table.importing_SRID = params[:srid] || CartoDB::SRID
      @table.force_schema   = params[:schema]              if params[:schema]
      @table.the_geom_type  = params[:the_geom_type]       if params[:the_geom_type]
      
      if @table.valid? && @table.save      
        render_jsonp({ :id => @table.id, 
                       :name => @table.name, 
                       :schema => @table.schema }, 200, :location => table_path(@table))
      else
        @data_import.reload
        CartoDB::Logger.info "Errors on tables#create", @table.errors.full_messages
        if @table.data_import_id
          render_jsonp({ :description => @data_import.get_error_text ,
                      :stack =>  @data_import.log_json,
                      :code=>@data_import.error_code }, 
                      400)
        else
          render_jsonp({ :description => @data_import.get_error_text, :stack => @table.errors.full_messages, :code=>@data_import.error_code }, 400)
        end
      end
    end
  rescue => e
    @data_import.reload
    # Add semantics based on the users creation method. 
    # TODO: The importer should throw these specific errors
    if !e.is_a? CartoDB::QuotaExceeded
      e = CartoDB::InvalidUrl.new     e.message    if params[:url]    
      e = CartoDB::InvalidFile.new    e.message    if params[:file]    
      e = CartoDB::TableCopyError.new e.message    if params[:table_copy]    
    end  
    CartoDB::Logger.info "Exception on tables#create", translate_error(e).inspect
    
    @data_import.reload
    render_jsonp({ :description => @data_import.get_error_text, :stack =>  @data_import.log_json, :code => @data_import.error_code }, 400)
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
      format.kml or format.kmz do
        send_data @table.to_kml,
          :type => 'application/vnd.google-earth.kml+xml; charset=binary; header=present',
          :disposition => "attachment; filename=#{@table.name}.kmz"
      end
      format.json do
        render_jsonp({ :id => @table.id,
                       :name => @table.name,
                       :privacy => table_privacy_text(@table),
                       :tags => @table[:tags_names],
                       :schema => @table.schema(:reload => true) })
      end
    end
  end

  def update
    @table = Table.filter(:user_id => current_user.id, :name => params[:id]).first
    @table.set_all(params)
    if params.keys.include?("latitude_column") && params.keys.include?("longitude_column")
      latitude_column  = params[:latitude_column]  == "nil" ? nil : params[:latitude_column].try(:to_sym)
      longitude_column = params[:longitude_column] == "nil" ? nil : params[:longitude_column].try(:to_sym)
      @table.georeference_from!(:latitude_column => latitude_column, :longitude_column => longitude_column)
    end
    @table.tags = params[:tags] if params[:tags]
    if @table.save
      @table = Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                            from user_tables
                            where id=?",@table.id).first
                            
      render_jsonp({ :id => @table.id,                 
                     :name => @table.name,
                     :privacy => table_privacy_text(@table),
                     :tags => @table[:tags_names],
                     :schema => @table.schema })
    else
      render_jsonp({ :errors => @table.errors.full_messages}, 400)
    end
  rescue => e
    CartoDB::Logger.info e.class.name, e.message
    render_jsonp({ :errors => [translate_error(e.message.split("\n").first)] }, 400) and return
  end

  def destroy
    @table.destroy
    head :ok
  end
  
  # expects the infowindow data in the infowindow parameter
  def set_infowindow
    @table.infowindow = params[:infowindow]
    head :ok
  end
  
  def set_map_metadata
    @table.map_metadata = params[:map_metadata]
    head :ok
  end

  #todo: replace with windshaft
  def get_map_metadata
    render_jsonp({:map_metadata => @table.map_metadata})
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
  def fix_openstreetmap_url url
    params = Rack::Utils.parse_query(url.split('?')[1])
    #2h, 6w
    lon = params['lon'].to_f
    lat = params['lat'].to_f
    zm = params['zoom'].to_i
    
    dw = 1200.0/2.0
    dh = 1000.0/2.0
    
    res = 180 / 256.0 / 2**zm
    py = (90 + lat) / res
    px = (180 + lon) / res
    lpx = px - dw
    lpy = py - dh
    upx = px + dw
    upy = py + dh
    
    lon1 = (res * lpx) - 180
    lat1 = (res * lpy) - 90
    lon2 = (res * upx) - 180
    lat2 = (res * upy) - 90
    
    return "http://api.openstreetmap.org/api/0.6/map?bbox=#{lon1},#{lat1},#{lon2},#{lat2}" 
  end
end