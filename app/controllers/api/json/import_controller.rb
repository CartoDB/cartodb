# coding: UTF-8

class Api::Json::ImportController < Api::ApplicationController
  :create
  
  before_filter :set_start_time
  after_filter  :record_query_threshold
  
  def create
    # create a ne import log
    @data_import  = DataImport.new(:user_id => current_user.id)
    @data_import.updated_at = Time.now
    @data_import.save
    
    if params[:append].present?
      payload, location = append_to_existing params
      render_jsonp(payload, 200, :location => location)
    elsif params[:migrate_table].present?
      payload, location = migrate_existing params[:migrate_table]
      unless location.nil?
        render_jsonp(payload, 200, :location => location)
      else
        render_jsonp(payload, 400)
      end
    elsif params[:table_copy].present? or params[:from_query].present?
      query = params[:table_copy] ? "SELECT * FROM #{params[:table_copy]}" : params[:from_query]
      new_table_name = import_from_query params[:name], query
      payload, location = migrate_existing new_table_name
      unless location.nil?
        render_jsonp(payload, 200, :location => location)
      else
        render_jsonp(payload, 400)
      end
    elsif params[:url].present? or params[:file].present?
      method = params[:file] ? 'file': 'url'
      src = params[:file] ? params[:file] : params[:url]
      imports, errors = import_to_cartodb method, src
      unless imports.nil?
        results = Array.new
        
        imports.each do | import |
          payload, location = migrate_existing import.name, params[:name]
          results << [payload,location]
        end
        if results.length == 0
          if errors.length == 0
            render_jsonp({ :description => 'Unknown', :stack => [], :code=> 99999 }, 400)
          elsif errors.length == 1
            render_jsonp({ :description => errors[0].description, :stack => errors[0].stack, :code=> errors[0].code }, 400)
          else
            stack = Array.new
            stack << "You uploaded a file containing multiple imports.\nNone of them successfully finished.\nTo debug this problem, try uploading each one as an individual file.\n"
            error_ct = 1
            errors.each{|error|
              # TODO change File CT with File NAME
              stack << "File #{error_ct}: \n"
              stack << "#{error.description}\n"
              error.stack.each{ |m| stack << "#{m}\n" }
              error_ct += 1
            }
            render_jsonp({ :description => "Multifile import errors", :stack => stack, :code=> 1007 }, 400)
          end
        elsif results.length == 1
          payload, location = results[0]
          unless location.nil?
            render_jsonp(payload, 200, :location => location)
          else
            render_jsonp(payload, 400)
          end
        else
          # TODO add method for all failed
          warnings = Array.new
          table_count = 0
          file_count = 0
          results.each { | payload, location |
            file_count = file_count+1
            unless location.nil?
              table_count = table_count+1
            end
          }
          message = "#{table_count}/#{file_count} table(s) successfully created"
          
          # TODO remove :tag when front-end will accept just a successful table list
          render_jsonp({:tag => " "}, 201, :location => '/dashboard')
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
  def import_from_query name, query
    @data_import.data_type = 'query'
    @data_import.data_source = query
    @data_import.save
    # ensure unique name
    uniname = get_valid_name(name)
    # create a table based on the query
    table_owner.in_database.run("CREATE TABLE #{uniname} AS #{query}")
    return uniname
  end
  def migrate_existing table, name = nil
    
    new_name = name.nil? ? table : name
    
    #the below is redudant with the method below after import.nil?, should factor
    @new_table = Table.new 
    @new_table.user_id = current_user.id
    @new_table.name = new_name
    
    @new_table.user_id =  @data_import.user_id
    @new_table.data_import_id = @data_import.id
    @new_table.migrate_existing_table = table
    
    if @new_table.valid?
      @new_table.save
      @data_import.refresh
      payload = {:id => @new_table.id, 
                      :name => @new_table.name, 
                      :schema => @new_table.schema}
      location = table_path(@new_table)
    else
      @data_import.reload
      CartoDB::Logger.info "Errors on import#create", @new_table.errors.full_messages
      if @new_table.data_import_id
        payload = { :description => @data_import.get_error_text ,
                    :stack =>  @data_import.log_json,
                    :code=>@data_import.error_code }
      else
        payload = { :description => @data_import.get_error_text, 
                    :stack => @table.errors.full_messages, 
                    :code=>@data_import.error_code }
      end
      location = nil
    end
    return [payload, location]
  end
  def append_to_existing params
    #handle table appending. table appending doesn't work with OSM files, so after the multi check
    @data_import = DataImport.new(:user_id => current_user.id)
    @data_import.updated_at = Time.now
    @data_import.save
    
    @new_table = Table.new
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
  
    return [{:id => @table.id, 
                 :name => @table.name, 
                 :schema => @table.schema}, table_path(@table)]
  end
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
      importer, errors = importer.import!
      @data_import.reload
      @data_import.imported
      return importer, errors
    #import from URL
    elsif method == 'url' 
      @data_import.data_type = 'url'
      @data_import.data_source = import_from_url
      @data_import.download
      @data_import.save
      importer = CartoDB::Importer.new ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => table_owner.database_username, 
        "password" => table_owner.database_password,
        :import_from_url => import_from_url, 
        :debug => (Rails.env.development?), 
        :remaining_quota => table_owner.remaining_quota,
        :data_import_id => @data_import.id
      ).symbolize_keys
      importer, errors = importer.import!
      @data_import.reload
      @data_import.imported
      @data_import.save
      return [importer, errors]
    end
  end
  
  def get_valid_name(raw_new_name = nil)
    # TODO add a delete table check in the cases where a table has become ghost
    # probably in the after_destroy method in table.rb
    
    # set defaults and sanity check
    raw_new_name = (raw_new_name || "untitled_table").sanitize
    
    # tables cannot be blank, start with numbers or underscore
    raw_new_name = "table_#{raw_new_name}" if raw_new_name =~ /^[0-9]/
    raw_new_name = "table#{raw_new_name}"  if raw_new_name =~ /^_/
    raw_new_name = "untitled_table"        if raw_new_name.blank?
    
    # Do a basic check for the new name. If it doesn't exist, let it through (sanitized)
    return raw_new_name if name_available?(raw_new_name)
        
    # Happens if we're duplicating a table.
    # First get candidates from the base name
    # eg: "simon_24" => "simon"
    if match = /(.+)_\d+$/.match(raw_new_name)
      raw_new_name = match[1]
    end  
    
    # return if no dupe
    return raw_new_name if name_available?(raw_new_name)

    # increment trailing number (max+1) if dupe
    max_candidate = name_candidates(raw_new_name).sort_by {|c| -c[/_(\d+)$/,1].to_i}.first  
    
    if max_candidate =~ /(.+)_(\d+)$/
      return $1 + "_#{$2.to_i + 1}"
    else
      return max_candidate + "_2"
    end
  end
  
  # return name if no dupe, else false
  def name_available?(name)                 
    name_candidates(name).include?(name) ? false : name 
  end    

  def name_candidates(name)
    # FYI: Native sequel (table_owner.in_database.tables) filters tables that start with sql or pg
    table_owner.tables.filter(:name.like(/^#{name}/)).select_map(:name)
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
    
    # the very particular case of osm.org url imports
    # MOVE THIS TO importer.rb
    # if params[:url] || params[:file]
    #   src = params[:file] ? params[:file] : params[:url]
    #   suggested_name = nil
    #   ext = nil
    #   if src =~ /openstreetmap.org/
    #     if src !~ /api.openstreetmap.org/
    #       src = fix_openstreetmap_url src
    #       
    #       @data_import.log_update("Openstreetmaps.org URL converted to API url")
    #       @data_import.log_update(src)
    #     end
    #     suggested_name = "osm_export"
    #     ext = ".osm"
    #   else
    #     ext =File.extname(src)
    #   end
    # end
    
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
  def table_owner    
    table_owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota).filter(:id => current_user.id).first
  end
end