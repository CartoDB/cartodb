# coding: UTF-8

class Api::Json::ImportController < Api::ApplicationController
  :create
  
  before_filter :set_start_time
  after_filter  :record_query_threshold
  
  def create
    @data_import  = DataImport.new(:user_id => current_user.id)
    @data_import.updated_at = Time.now
    @data_import.save
    
    # the very particular case of osm.org url imports
    # MOVE THIS TO importer.rb
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
    
    if params[:append].present?
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
          
      @new_table.reload
      @table = Table.filter(:user_id => current_user.id, :id => params[:table_id]).first
      @table.append_to_table(:from_table => @new_table)
      @table.save.reload
      # append_to_table doesn't automatically destroy the table
      @new_table.destroy
    
      render_jsonp({:id => @table.id, 
                   :name => @table.name, 
                   :schema => @table.schema}, 200, :location => table_path(@table))
    elsif params[:migrate_table].present?
      #the below is redudant with the method below after import.nil?, should factor
      @new_table = Table.new 
      @new_table.name = params[:migrate_table]  if params[:migrate_table]
      @new_table.user_id =  @data_import.user_id
      @new_table.data_import_id = @data_import.id
      @new_table.importing_SRID = params[:srid] || CartoDB::SRID
      @new_table.migrate_existing_table = params[:migrate_table]
      if @new_table.valid?
        @new_table.save
        @data_import.refresh
        render_jsonp({:id => @new_table.id, 
                        :name => @new_table.name, 
                        :schema => @new_table.schema}, 200, 
                      :location => table_path(@new_table))
      else
        @data_import.reload
        CartoDB::Logger.info "Errors on tables#create", @new_table.errors.full_messages
        if @new_table.data_import_id
          render_jsonp({ :description => @data_import.get_error_text ,
                      :stack =>  @data_import.log_json,
                      :code=>@data_import.error_code }, 
                      400)
        else
          render_jsonp({ :description => @data_import.get_error_text, :stack => @table.errors.full_messages, :code=>@data_import.error_code }, 400)
        end
      end
    else
      if params[:url].present?
        imports = import_to_cartodb 'url', params[:url]
      elsif params[:file].present?
        imports = import_to_cartodb 'file', params[:file]
      elsif params[:table_copy].present?
        imports = import_to_cartodb 'table_copy', params[:table_copy]
      elsif params[:from_query].present?
        imports = import_to_cartodb 'from_query', params[:from_query]
      end
      unless imports.nil?
        imports.each do | import |
          @new_table = Table.new 
          @new_table.name = params[:name]  if params[:name] || import.name # && !params[:table_copy]
          @new_table.user_id =  @data_import.user_id
          @new_table.data_import_id = @data_import.id
          @new_table.importing_SRID = params[:srid] || CartoDB::SRID
          # @new_table.name = import.first.name  
          @new_table.migrate_existing_table = import.name
          
          if imports.length == 1
            if @new_table.valid?
              @new_table.save
              @data_import.refresh
              render_jsonp({:id => @new_table.id, 
                              :name => @new_table.name, 
                              :schema => @new_table.schema}, 200, 
                              :location => table_path(@new_table))
            else
              @data_import.reload
              CartoDB::Logger.info "Errors on tables#create", @new_table.errors.full_messages
              if @new_table.data_import_id
                render_jsonp({ :description => @data_import.get_error_text ,
                            :stack =>  @data_import.log_json,
                            :code=>@data_import.error_code }, 
                            400)
              else
                render_jsonp({ :description => @data_import.get_error_text, :stack => @table.errors.full_messages, :code=>@data_import.error_code }, 400)
              end
            end
          end
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

  protected

  def import_to_cartodb method, import_source
    if method == 'file'    
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => current_user.database_name, 
        :logger => ::Rails.logger,
        "username" => current_user.database_username, 
        "password" => current_user.database_password,
        :import_from_file => import_source, 
        :debug => (Rails.env.development?), 
        :remaining_quota => current_user.remaining_quota,
        :data_import_id => @data_import.id
      ).symbolize_keys
      importer = CartoDB::Importer.new hash_in
      importer = importer.import!
      @data_import.reload
      @data_import.imported
      return importer
    end
    #import from URL
    if method == 'url' 
      @data_import.data_type = 'url'
      @data_import.data_source = import_from_url
      @data_import.download
      @data_import.save
      importer = CartoDB::Importer.new ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :import_from_url => import_from_url, 
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota,
        :data_import_id => @data_import.id
      ).symbolize_keys
      importer = importer.import!
      @data_import.reload
      @data_import.imported
      @data_import.save
      return importer.name
    end
    #Import from the results of a query
    if method == 'from_query'
      @data_import.data_type = 'query'
      @data_import.data_source = import_from_query
      @data_import.migrate
      @data_import.save
              
      # ensure unique name
      uniname = get_valid_name(self.name)
      
      # create a table based on the query
      owner.in_database.run("CREATE TABLE #{uniname} AS #{self.import_from_query}")
      
      # with table #{uniname} table created now run migrator to CartoDBify
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :current_name => uniname, 
        :suggested_name => uniname, 
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota,
        :data_import_id => @data_import.id
      ).symbolize_keys
      importer = CartoDB::Migrator.new hash_in
      importer = importer.migrate!
      @data_import.reload
      @data_import.migrated
      @data_import.save
      return importer.name
    end
    #Import from copying another table
    if method == 'table_copy'
      debugger
      @data_import.data_type = 'table'
      @data_import.data_source = import_source
      @data_import.migrate
      @data_import.save
      # ensure unique name
      uniname = get_valid_name(import_source)
      owner.in_database.run("CREATE TABLE #{uniname} AS SELECT * FROM #{import_source}")
      @data_import.imported
      owner.in_database.run("CREATE INDEX ON #{uniname} USING GIST(the_geom)")
      owner.in_database.run("CREATE INDEX ON #{uniname} USING GIST(#{THE_GEOM_WEBMERCATOR})")
      owner.in_database.run("UPDATE #{uniname} SET created_at = now()")
      owner.in_database.run("UPDATE #{uniname} SET updated_at = now()")
      owner.in_database.run("ALTER TABLE #{uniname} ALTER COLUMN created_at SET DEFAULT now()")
      set_trigger_the_geom_webmercator
      @data_import.migrated
      return uniname
    end
  end
  
  def load_table
    @table = Table.find_by_identifier(current_user.id, params[:id])
  end
  
  def record_query_threshold
    if response.ok?
      CartoDB::QueriesThreshold.incr(current_user.id, "other", Time.now - @time_start)
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