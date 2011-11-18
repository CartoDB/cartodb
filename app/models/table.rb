# coding: UTF-8
# Proxies management of a table in the users database
class Table < Sequel::Model(:user_tables)

  # App constants
  PRIVATE = 0
  PUBLIC  = 1
  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  RESERVED_COLUMN_NAMES = %W{ oid tableoid xmin cmin xmax cmax ctid }

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:privacy, :tags)

  attr_accessor :force_schema, :import_from_file,:import_from_url, :import_from_table_copy,
                :importing_SRID, :importing_encoding, :temporal_the_geom_type


  ## Callbacks
  def validate
    super
    errors.add(:user_id, 'can\'t be blank') if user_id.blank?
    errors.add(:privacy, 'has an invalid value') if privacy != PRIVATE && privacy != PUBLIC
    validates_unique [:name, :user_id], :message => 'is already taken'
  end

  def before_validation
    self.privacy ||= PRIVATE
    super
  end

  def before_create    
    update_updated_at
    self.database_name = owner.database_name    

    #import from file
    if import_from_file.present? or import_from_url.present? or import_from_table_copy.present?
      
      if import_from_file.present?        
        hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          "database" => database_name, 
          :logger => ::Rails.logger,
          "username" => owner.database_username, 
          "password" => owner.database_password,
          :import_from_file => import_from_file, 
          :debug => (Rails.env.development?), 
          :remaining_quota => owner.remaining_quota
        ).symbolize_keys

        importer = CartoDB::Importer.new hash_in
        importer_result_name = importer.import!.name
      end

      #import from URL
      if import_from_url.present?
        importer = CartoDB::Importer.new ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          "database" => database_name, 
          :logger => ::Rails.logger,
          "username" => owner.database_username, 
          "password" => owner.database_password,
          :import_from_url => import_from_url, 
          :debug => (Rails.env.development?), 
          :remaining_quota => owner.remaining_quota
        ).symbolize_keys
        
        importer_result_name = importer.import!.name
      end

      #Import from copying another table
      if import_from_table_copy.present?
                
        # ensure unique name
        uniname = get_valid_name(self.name)
        owner.in_database.run("CREATE TABLE #{uniname} AS SELECT * FROM #{import_from_table_copy}")
        owner.in_database.run("CREATE INDEX ON #{uniname} USING GIST(the_geom)")
        owner.in_database.run("CREATE INDEX ON #{uniname} USING GIST(#{THE_GEOM_WEBMERCATOR})")
        owner.in_database.run("UPDATE #{uniname} SET created_at = now()")
        owner.in_database.run("UPDATE #{uniname} SET updated_at = now()")
        owner.in_database.run("ALTER TABLE #{uniname} ALTER COLUMN created_at SET DEFAULT now()")
        set_trigger_the_geom_webmercator
        importer_result_name = uniname
      end

      self[:name] = importer_result_name
      schema = self.schema(:reload => true)

      owner.in_database do |user_database|
        # If we already have a cartodb_id column let's rename it to an auxiliary column
        aux_cartodb_id_column = nil
        if schema.present? && schema.flatten.include?(:cartodb_id)
           aux_cartodb_id_column = "cartodb_id_aux_#{Time.now.to_i}"
           user_database.run("ALTER TABLE #{self.name} RENAME COLUMN cartodb_id TO #{aux_cartodb_id_column}")
        end

        # When tables are created using ogr2ogr they are added a ogc_fid primary key
        # In that case:
        #  - If cartodb_id already exists, remove ogc_fid
        #  - If cartodb_id does not exist, remove the primary key constraint and treat ogc_fid as the auxiliary column
        if schema.present? && schema.flatten.include?(:ogc_fid)
          if aux_cartodb_id_column.nil?
            aux_cartodb_id_column = "ogc_fid"
          else
            user_database.run("ALTER TABLE #{self.name} DROP COLUMN ogc_fid")
          end
        end
        if schema.present? && schema.flatten.include?(:gid)
          if aux_cartodb_id_column.nil?
            aux_cartodb_id_column = "gid"
          else
            user_database.run("ALTER TABLE #{self.name} DROP COLUMN gid")
          end
        end

        user_database.run("ALTER TABLE #{self.name} ADD COLUMN cartodb_id SERIAL")

        # If there's an auxiliary column, copy and restart the sequence to the max(cartodb_id)+1
        # Do this before adding constraints cause otherwise we can have duplicate key errors
        if aux_cartodb_id_column.present?
          user_database.run("UPDATE #{self.name} SET cartodb_id = CAST(#{aux_cartodb_id_column} AS INTEGER)")
          user_database.run("ALTER TABLE #{self.name} DROP COLUMN #{aux_cartodb_id_column}")
          cartodb_id_sequence_name = user_database["SELECT pg_get_serial_sequence('#{self.name}', 'cartodb_id')"].first[:pg_get_serial_sequence]
          max_cartodb_id = user_database["SELECT max(cartodb_id) FROM #{self.name}"].first[:max] 
          
          # only reset the sequence on real imports. 
          # skip for duplicate tables as they have totaly new names, but have aux_cartodb_id columns         
          if max_cartodb_id
            user_database.run("ALTER SEQUENCE #{cartodb_id_sequence_name} RESTART WITH #{max_cartodb_id+1}") 
          end  
        end

        user_database.run("ALTER TABLE #{self.name} ADD PRIMARY KEY (cartodb_id)")
      
        normalize_timestamp_field!(:created_at, user_database)
        normalize_timestamp_field!(:updated_at, user_database)

      end
      set_the_geom_column!
    else
      create_table_in_database!
      if !self.temporal_the_geom_type.blank?
        self.the_geom_type = self.temporal_the_geom_type
        self.temporal_the_geom_type = nil
      end
      set_the_geom_column!(self.the_geom_type)
    end
    
    # test for exceeding of quota after creation
    raise CartoDB::QuotaExceeded, "#{owner.quota_overspend / 1024}KB more space is required" if owner.exceeded_quota?

    super
  rescue => e
    CartoDB::Logger.info "table#create error", "#{e.inspect}"      
    unless self.name.blank?
      $tables_metadata.del key
      owner.in_database(:as => :superuser).run("DROP TABLE IF EXISTS #{self.name}")
    end

    if @import_from_file
      @import_from_file = URI.escape(@import_from_file) if @import_from_file =~ /^http/
      open(@import_from_file) do |res|
        filename = "#{File.basename(@import_from_file).split('.').first}_#{Time.now.to_i}#{File.extname(@import_from_file)}"
        @import_from_file = File.new Rails.root.join('public', 'uploads', 'failed_imports', filename), 'w'
        @import_from_file.write res.read.force_encoding('utf-8')
        @import_from_file.close
      end
      
      # nill required for this bug https://github.com/airbrake/airbrake/issues/34
      Airbrake.notify(nil, 
        :error_class   => "Import Error",
        :error_message => "Import Error: #{e.try(:message)}",
        :backtrace     => e.try(:backtrace),
        :parameters    => {
          :database  => database_name,
          :username  => owner.database_username,
          :temp_file => @import_from_file.path
        }
      )
    end

    raise e
  end

  # adds the column if not exists or cast it to timestamp field
  def normalize_timestamp_field!(field, user_database)
    schema = self.schema(:reload => true)
    if schema.nil? || !schema.flatten.include?(field)
        user_database.run("ALTER TABLE #{self.name} ADD COLUMN #{field.to_s} timestamp DEFAULT NOW()")
    end

    if !schema.nil?
      field_type = Hash[schema][field]
      # if column already exists, cast to timestamp value and set default
      if field_type == 'string' && schema.flatten.include?(field)
          #TODO: check type
          sql = <<-ALTERCREATEDAT
              ALTER TABLE #{self.name} ALTER COLUMN #{field.to_s} TYPE timestamp without time zone
              USING to_timestamp(#{field.to_s}, 'YYYY-MM-DD HH24:MI:SS.MS.US'),
              ALTER COLUMN #{field.to_s} SET DEFAULT now();
          ALTERCREATEDAT
          user_database.run(sql)
      end
    end
  end

  def after_save
    super
    manage_tags
    move_metadata_if_needed
  end

  def after_create
    super
    User.filter(:id => user_id).update(:tables_count => :tables_count + 1)
    owner.in_database(:as => :superuser).run("GRANT SELECT ON #{self.name} TO #{CartoDB::TILE_DB_USER};")
    add_python
    set_trigger_update_updated_at
    set_trigger_cache_timestamp
    set_trigger_check_quota
    
    @force_schema = nil
    $tables_metadata.multi do
      $tables_metadata.hset key, "user_id", user_id
      $tables_metadata.hset key, "privacy", PRIVATE
    end
  end

  def before_destroy
    $tables_metadata.del key
  end

  def after_destroy
    super
    Tag.filter(:user_id => user_id, :table_id => id).delete
    User.filter(:id => user_id).update(:tables_count => :tables_count - 1)
    owner.in_database(:as => :superuser) do |user_database|
      begin
        user_database.run("DROP SEQUENCE IF EXISTS cartodb_id_#{oid}_seq")
      rescue => e
        CartoDB::Logger.info "Table#after_destroy error", "maybe table #{self.name} doesn't exist: #{e.inspect}"      
      end
      user_database.run("DROP TABLE IF EXISTS #{self.name}")
    end
  end
  ## End of Callbacks

  def name=(value)
    return if value == self[:name] || value.blank?
    new_name = get_valid_name(value)
    owner.in_database.rename_table(name, new_name) unless new?

    # Do not keep track of name changes until table has been saved
    @name_changed_from = self.name if !new? && self.name.present?
    self[:name] = new_name
  end

  def tags=(value)
    self[:tags] = value.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
  end

  def infowindow=(value)
    $tables_metadata.hset(key, 'infowindow', value)
  end

  def infowindow
    $tables_metadata.hget(key, 'infowindow')
  end
  
  def map_metadata=(value)
    $tables_metadata.hset(key, 'map_metadata', value)
  end

  def map_metadata
    $tables_metadata.hget(key, 'map_metadata')
  end  

  def private?
    $tables_metadata.hget(key, "privacy").to_i == PRIVATE
  end

  def public?
    !private?
  end

  def privacy=(value)
    if value == "PRIVATE" || value == PRIVATE || value == PRIVATE.to_s
      self[:privacy] = PRIVATE
      unless new?
        owner.in_database(:as => :superuser).run("REVOKE SELECT ON #{self.name} FROM #{CartoDB::PUBLIC_DB_USER};")
        $tables_metadata.hset key, "privacy", PRIVATE
      end
    elsif value == "PUBLIC" || value == PUBLIC || value == PUBLIC.to_s
      self[:privacy] = PUBLIC
      unless new?
        $tables_metadata.hset key, "privacy", PUBLIC
        owner.in_database(:as => :superuser).run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      end
    end
  end

  def key
    Table.key(database_name, name)
  rescue
    nil
  end

  def self.key(db_name, table_name)
    "rails:#{db_name}:#{table_name}"
  end

  def sequel
    owner.in_database[name.to_sym]
  end

  def rows_counted
    sequel.count
  end
  
  # returns table size in bytes
  def table_size
    @table_size ||= owner.in_database["SELECT pg_relation_size('#{self.name}') as size"].first[:size] / 2
  end  
  
  # TODO: make predictable. Alphabetical would be better
  def schema(options = {})
    first_columns     = []
    middle_columns    = []
    last_columns      = []
    owner.in_database.schema(self.name, options.slice(:reload)).each do |column|
      next if column[0] == THE_GEOM_WEBMERCATOR
      col_db_type = column[1][:db_type].starts_with?("geometry") ? "geometry" : column[1][:db_type]
      col = [ column[0],
        (options[:cartodb_types] == false) ? col_db_type : col_db_type.convert_to_cartodb_type,
        col_db_type == "geometry" ? "geometry" : nil,
        col_db_type == "geometry" ? the_geom_type : nil
      ].compact

      # Make sensible sorting for UI
      case column[0]
        when :cartodb_id
          first_columns.insert(0,col)
        when :the_geom
          first_columns.insert(1,col)  
        when :created_at, :updated_at
          last_columns.insert(-1,col)
        else
          middle_columns << col
      end
    end
    
    # sort middle columns alphabetically
    middle_columns.sort! {|x,y| x[0].to_s <=> y[0].to_s}
    
    # group columns together and return
    (first_columns + middle_columns + last_columns).compact
  end

  def insert_row!(raw_attributes)
    primary_key = nil
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes, "Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}"
      end
      begin
        primary_key = user_database[name.to_sym].insert(attributes.except(THE_GEOM).convert_nulls)
      rescue Sequel::DatabaseError => e        
        message = e.message.split("\n")[0]
        
        # If the type don't match the schema of the table is modified for the next valid type
        invalid_value = (m = message.match(/"([^"]+)"$/)) ? m[1] : nil
        invalid_column = if invalid_value
          attributes.invert[invalid_value] # which is the column of the name that raises error
        else
          if m = message.match(/PGError: ERROR:  value too long for type (.+)$/)
            if candidate = schema(:cartodb_types => false).select{ |c| c[1].to_s == m[1].to_s }.first
              candidate[0]
            end
          end
        end
        
        if new_column_type = get_new_column_type(invalid_column)
          user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
          retry
        else
          raise e
        end
      end
    end
    update_the_geom!(raw_attributes, primary_key)
    primary_key
  end

  def update_row!(row_id, raw_attributes)
    rows_updated = 0
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes, "Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}"
      end
      if !attributes.except(THE_GEOM).empty?
        begin
          rows_updated = user_database[name.to_sym].filter(:cartodb_id => row_id).update(attributes.except(THE_GEOM).convert_nulls)
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          message = e.message.split("\n")[0]
          
          invalid_value = (m = message.match(/"([^"]+)"$/)) ? m[1] : nil
          if invalid_value
            invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error

            if new_column_type = get_new_column_type(invalid_column)
              user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
              retry
            end
          else
            raise e
          end          
        end  
      else
        if attributes.size == 1 && attributes.keys == [THE_GEOM]
          rows_updated = 1
        end
      end
    end
    update_the_geom!(raw_attributes, row_id)
    rows_updated
  end

  def add_column!(options)
    raise CartoDB::InvalidColumnName if RESERVED_COLUMN_NAMES.include?(options[:name]) || options[:name] =~ /^[0-9_]/
    type = options[:type].convert_to_db_type
    cartodb_type = options[:type].convert_to_cartodb_type
    owner.in_database.add_column name.to_sym, options[:name].to_s.sanitize, type
    return {:name => options[:name].to_s.sanitize, :type => type, :cartodb_type => cartodb_type}
  rescue => e
    if e.message =~ /^PGError/
      raise CartoDB::InvalidType, e.message
    else
      raise e
    end
  end

  def drop_column!(options)
    raise if CARTODB_COLUMNS.include?(options[:name].to_s)
    owner.in_database.drop_column name.to_sym, options[:name].to_s
  end

  def modify_column!(options)
    new_name = options[:name] || options[:old_name]
    new_type = options[:type] ? options[:type].try(:convert_to_db_type) : schema(:cartodb_types => false).select{ |c| c[0] == new_name.to_sym }.first[1]
    cartodb_type = new_type.try(:convert_to_cartodb_type)
    
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        raise CartoDB::InvalidColumnName if options[:new_name] =~ /^[0-9_]/ || RESERVED_COLUMN_NAMES.include?(options[:new_name])
        raise if CARTODB_COLUMNS.include?(options[:old_name].to_s)
        user_database.rename_column name.to_sym, options[:old_name].to_sym, options[:new_name].sanitize.to_sym
        new_name = options[:new_name].sanitize
      end
      if options[:type]
        column_name = (options[:new_name] || options[:name]).sanitize
        raise if CARTODB_COLUMNS.include?(column_name)
        begin
          user_database.set_column_type name.to_sym, column_name.to_sym, new_type
        rescue => e
          message = e.message.split("\n").first
          if message =~ /cannot be cast to type/
            begin
              user_database.transaction do
                random_name = "new_column_#{rand(10)*Time.now.to_i}"
                user_database.add_column name.to_sym, random_name, new_type
                user_database.run("UPDATE #{name} SET #{random_name}=cast(#{column_name} as #{new_type})")
                user_database.drop_column name.to_sym, column_name.to_sym
                user_database.rename_column name.to_sym, random_name, column_name.to_sym
              end
            rescue
              user_database.transaction do
                random_name = "new_column_#{rand(10)*Time.now.to_i}"
                user_database.add_column name.to_sym, random_name, new_type
                user_database.drop_column name.to_sym, column_name.to_sym
                user_database.rename_column name.to_sym, random_name, column_name.to_sym
              end
            end
          else
            raise e
          end
        end
      end
    end
    return {:name => new_name, :type => new_type, :cartodb_type => cartodb_type}
  end

  def records(options = {})
    rows  = []
    records_count = rows_counted
    page, per_page = CartoDB::Pagination.get_page_and_per_page(options)
    order_by_column = options[:order_by] || "cartodb_id"
    mode = (options[:mode] || 'asc').downcase == 'asc' ? 'asc' : 'desc'
    filters = options.slice(:filter_column, :filter_value).reject{|k,v| v.blank?}.values
    where = "WHERE (#{filters.first})|| '' ILIKE '%#{filters.second}%'" if filters.present?

    owner.in_database do |user_database|
      columns_sql_builder = <<-SQL
      SELECT array_to_string(ARRAY(SELECT '#{name}' || '.' || c.column_name
        FROM information_schema.columns As c
        WHERE table_name = '#{name}'
        AND c.column_name <> 'the_geom_webmercator'
        ), ',') AS column_names
      SQL

      column_names = user_database[columns_sql_builder].first[:column_names].split(',')
      if the_geom_index = column_names.index("#{name}.the_geom")
        #if the geometry type of the table is POINT we send the data,
        #if not we will send an string and will have to be requested on demand
        if user_database["SELECT type from geometry_columns where f_table_name = '#{name}'
             and f_geometry_column = 'the_geom'"].first[:type] == "POINT"
          column_names[the_geom_index] = "ST_AsGeoJSON(the_geom,6) as the_geom"
        else
          column_names[the_geom_index] = "'GeoJSON' as the_geom"
        end
      end
      select_columns = column_names.join(',')

      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      rows = user_database["SELECT #{select_columns} FROM #{name} #{where} ORDER BY #{order_by_column} #{mode} LIMIT #{per_page} OFFSET #{page}"].all
      records_count = user_database["SELECT COUNT(cartodb_id) as total_rows FROM #{name} #{where} "].get(:total_rows)
    end
    {
      :id         => id,
      :name       => name,
      :total_rows => records_count,
      :rows       => rows
    }
  end

  def record(identifier)
    row = nil
    owner.in_database do |user_database|
      select = if schema.flatten.include?(THE_GEOM)
        schema.select{|c| c[0] != THE_GEOM }.map{|c| c[0] }.join(',') + ",ST_AsGeoJSON(the_geom,6) as the_geom"
      else
        schema.map{|c| c[0] }.join(',')
      end
      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      row = user_database["SELECT #{select} FROM public.#{name} WHERE cartodb_id = #{identifier}"].first
    end
    raise if row.nil?
    row
  end

  def run_query(query)
    owner.run_query(query)
  end

  def georeference_from!(options = {})
    if !options[:latitude_column].blank? && !options[:longitude_column].blank?
      set_the_geom_column!("point")
            
      owner.in_database do |user_database|
        user_database.run(<<-GEOREF
        UPDATE #{self.name} 
        SET the_geom = 
          ST_GeomFromText(
            'POINT(' || #{options[:longitude_column]} || ' ' || #{options[:latitude_column]} || ')',#{CartoDB::SRID}
        ) 
        WHERE 
        trim(CAST(#{options[:longitude_column]} AS text)) ~ '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$' 
        AND   
        trim(CAST(#{options[:latitude_column]} AS text)) ~ '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
        GEOREF
        )
      end
      schema(:reload => true)
    else
      raise InvalidArgument
    end
  end


  def the_geom_type
    $tables_metadata.hget(key,"the_geom_type") || "point"
  end

  def the_geom_type=(value)
    the_geom_type_value = case value.downcase
      when "point"
        "point"
      when "line"
        "multilinestring"
      else
        value !~ /^multi/ ? "multi#{value.downcase}" : value.downcase
    end
    raise CartoDB::InvalidGeomType unless CartoDB::VALID_GEOMETRY_TYPES.include?(the_geom_type_value)
    if owner.in_database.table_exists?(name)
      $tables_metadata.hset(key,"the_geom_type",the_geom_type_value)
    else
      self.temporal_the_geom_type = the_geom_type_value
    end
  end

  def to_csv
    csv_zipped = nil
    table_name = "csv_export_temp_#{self.name}"
    file_name = "#{self.name}_export"
    csv_file_path = Rails.root.join('tmp', "#{file_name}.csv")
    zip_file_path  = Rails.root.join('tmp', "#{file_name}.zip")
    FileUtils.rm_rf(Dir.glob(csv_file_path))
    FileUtils.rm_rf(Dir.glob(zip_file_path))      
        
    owner.in_database do |user_database|      
      # Setup data export table
      user_database.run("DROP TABLE IF EXISTS #{table_name}")
      export_schema = self.schema.map{|c| c.first} - [THE_GEOM]
      export_schema += ["ST_AsGeoJSON(the_geom, 6) as the_geom"] if self.schema.map{|c| c.first}.include?(THE_GEOM)
      user_database.run("CREATE TABLE #{table_name} AS SELECT #{export_schema.join(',')} FROM #{self.name}")

      # Configure Postgres COPY command for dumping to CSV
      db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
      host     = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
      port     = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
      username = db_configuration['username']
      command  = "COPY (SELECT * FROM #{table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
      
      # Execute CSV dump and log
      cmd = "#{`which psql`.strip} #{host} #{port} -U#{username} -w #{database_name} -c\"#{command}\" > #{csv_file_path}"      
      system cmd
      #CartoDB::Logger.info "Converted #{table_name} to CSV", cmd            
      
      # remove table whatever happened
      user_database.run("DROP TABLE #{table_name}")
      
      # Compress output
      # TODO: Move to ZLib, this is silly
      # http://jimneath.org/2010/01/04/cryptic-ruby-global-variables-and-their-meanings.html
      if $?.success?
        Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
          zipfile.add(File.basename(csv_file_path), csv_file_path)
        end
        return File.read(zip_file_path)      
      end  
    end
  ensure
    # Always cleanup files    
    FileUtils.rm_rf(Dir.glob(csv_file_path))
    FileUtils.rm_rf(Dir.glob(zip_file_path))      
  end

  def to_shp
    shp_files_name = "#{self.name}_export"
    all_files_path = Rails.root.join('tmp', "#{shp_files_name}.*")
    shp_file_path  = Rails.root.join('tmp', "#{shp_files_name}.shp")
    zip_file_path  = Rails.root.join('tmp', "#{shp_files_name}.zip")
    pgsql2shp_bin  = `which pgsql2shp`.strip
    FileUtils.rm_rf(Dir.glob(all_files_path))
    
    # Configure pgsql to shp arguments
    db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
    host     = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
    port     = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
    username = db_configuration['username']

    # build command and execute
    cmd = "#{pgsql2shp_bin} #{host} #{port} -u #{username} -f #{shp_file_path} #{database_name} #{self.name}"    
    system cmd
    #CartoDB::Logger.info "Converted #{self.name} to SHP", cmd            

    # Compress output
    # TODO: Move to ZLib, this is silly
    # http://jimneath.org/2010/01/04/cryptic-ruby-global-variables-and-their-meanings.html
    if $?.success?
      Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
        Dir.glob(Rails.root.join('tmp',"#{shp_files_name}.*").to_s).each do |f|
          zipfile.add(File.basename(f), f)
        end
      end
      return File.read(zip_file_path)      
    end
  ensure
    # Always cleanup
    FileUtils.rm_rf(Dir.glob(all_files_path))
  end

  def self.find_all_by_user_id_and_tag(user_id, tag_name)
    fetch("select user_tables.*,
                    array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id),',') as tags_names
                        from user_tables, tags
                        where user_tables.user_id = ?
                          and user_tables.id = tags.table_id
                          and tags.name = ?
                        order by user_tables.id DESC", user_id, tag_name)
  end

  def self.find_by_identifier(user_id, identifier)
    col = (identifier =~ /\A\d+\Z/ || identifier.is_a?(Fixnum)) ? 'id' : 'name'
    
    table = fetch("SELECT *, array_to_string(array(
                     SELECT tags.name FROM tags WHERE tags.table_id = user_tables.id ORDER BY tags.id),',') AS tags_names
                   FROM user_tables WHERE user_tables.user_id = ? AND user_tables.#{col} = ?", user_id, identifier).first
    raise RecordNotFound if table.nil?
    table
  end
  
  def self.find_by_subdomain(subdomain, identifier)
    if user = User.find(:username => subdomain)      
      Table.find_by_identifier(user.id, identifier)
    end  
  end

  def oid
    @oid ||= owner.in_database["SELECT '#{self.name}'::regclass::oid"].first[:oid]
  end


  # DB Triggers and things
  def add_python
    owner.in_database(:as => :superuser).run(<<-SQL
      CREATE OR REPLACE PROCEDURAL LANGUAGE 'plpythonu' HANDLER plpython_call_handler; 
    SQL
    )
  end
  
  def set_trigger_the_geom_webmercator
    owner.in_database(:as => :superuser).run(<<-TRIGGER
      DROP TRIGGER IF EXISTS update_the_geom_webmercator_trigger ON #{self.name};
      CREATE OR REPLACE FUNCTION update_the_geom_webmercator() RETURNS trigger AS $update_the_geom_webmercator_trigger$
        BEGIN
              NEW.#{THE_GEOM_WEBMERCATOR} := ST_Transform(NEW.the_geom,#{CartoDB::GOOGLE_SRID});
              RETURN NEW;
        END;
      $update_the_geom_webmercator_trigger$ LANGUAGE plpgsql VOLATILE COST 100;

      CREATE TRIGGER update_the_geom_webmercator_trigger
      BEFORE INSERT OR UPDATE OF the_geom ON #{self.name}
         FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();
TRIGGER
    )
  end

  def set_trigger_update_updated_at
    owner.in_database(:as => :superuser).run(<<-TRIGGER
      DROP TRIGGER IF EXISTS update_updated_at_trigger ON #{self.name};

      CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $update_updated_at_trigger$
        BEGIN
               NEW.updated_at := now();
               RETURN NEW;
        END;
      $update_updated_at_trigger$ LANGUAGE plpgsql;

      CREATE TRIGGER update_updated_at_trigger
      BEFORE UPDATE ON #{self.name}
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
TRIGGER
    )
  end

  # move to C
  def set_trigger_cache_timestamp
    owner.in_database(:as => :superuser).run(<<-TRIGGER
    CREATE OR REPLACE FUNCTION update_timestamp() RETURNS trigger AS
    $$    
        if 'redis' not in GD:        
            import redis   
            GD['redis'] = redis.Redis();

        if 'time' not in GD:
            from time import time
            GD['time'] = time                                

        table_name = TD["table_name"]    
        db_name    = "#{self.database_name}"
        cache_key  = ":".join(["cache", db_name, table_name, "last_updated_at"])
        last_updated_at = GD['time']()

        GD['redis'].set(cache_key, last_updated_at)
    $$
    LANGUAGE 'plpythonu' VOLATILE;

    DROP TRIGGER IF EXISTS cache_checkpoint ON #{self.name};
    CREATE TRIGGER cache_checkpoint BEFORE UPDATE OR INSERT OR DELETE OR TRUNCATE ON #{self.name} EXECUTE PROCEDURE update_timestamp();
TRIGGER
    )
  end

  # move to C
  def set_trigger_check_quota
    owner.in_database(:as => :superuser).run(<<-TRIGGER
    CREATE OR REPLACE FUNCTION check_quota() RETURNS trigger AS
    $$
    c = SD.get('quota_counter', 0)
    m = SD.get('quota_mod', 1000)
    QUOTA_MAX = #{self.owner.quota_in_bytes}
    
    if c%m == 0:
        s = plpy.execute("SELECT sum(pg_relation_size(table_name)) FROM information_schema.tables WHERE table_catalog = '#{self.database_name}' AND table_schema = 'public'")[0]['sum'] / 2
        int_s = int(s) 
        diff = int_s - QUOTA_MAX
        SD['quota_mod'] = min(1000, max(1, diff))
        if int_s > QUOTA_MAX:
            raise Exception("Quota exceeded by %sKB" % (diff/1024))
    SD['quota_counter'] = c + 1
    $$
    LANGUAGE 'plpythonu' VOLATILE;
    
    DROP TRIGGER IF EXISTS test_quota ON #{self.name};
    CREATE TRIGGER test_quota BEFORE UPDATE OR INSERT ON #{self.name} EXECUTE PROCEDURE check_quota();
  TRIGGER
  )  
  end

  def owner    
    @owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes).filter(:id => self.user_id).first
  end

  private

  def update_updated_at
    self.updated_at = Time.now
  end

  def update_updated_at!
    update_updated_at && save_changes
  end

  # Returns a valid name for a table
  # Handles:
  # * sanitation
  # * duplicate checking
  # * incrementing trailing counter if duplicate
  #
  # Note, trailing counter increments the maximum trailing number found. 
  # This means gaps in a counter range will be made if the user manually sets
  # the name of a table with a trailing number. 
  #
  # Duplicating a table manually loaded called "my_table_2010" => "my_table_2011"
  #
  # TODO: Far too clever approach. Just recursivly append "_copy" if duplicate
  def get_valid_name(raw_new_name = nil)
    
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
    # FYI: Native sequel (owner.in_database.tables) filters tables that start with sql or pg
    owner.tables.filter(:name.like(/^#{name}/)).select_map(:name)
  end  

  def get_new_column_type(invalid_column)
    flatten_cartodb_schema = schema.flatten
    cartodb_column_type = flatten_cartodb_schema[flatten_cartodb_schema.index(invalid_column.to_sym) + 1]
    flatten_schema = schema(:cartodb_types => false).flatten
    column_type = flatten_schema[flatten_schema.index(invalid_column.to_sym) + 1]
    CartoDB::NEXT_TYPE[cartodb_column_type]
  end

  # REVIEW
  # TODO: run STMakeValid.
  # TODO: Ensure isValid is set for all tables, imported or not
  def set_the_geom_column!(type = nil)
    if type.nil?
      if self.schema(:reload => true).flatten.include?(THE_GEOM)
        if self.schema.select{ |k| k[0] == THE_GEOM }.first[1] == "geometry"
          if row = owner.in_database["select GeometryType(#{THE_GEOM}) FROM #{self.name} where #{THE_GEOM} is not null limit 1"].first
            type = row[:geometrytype]
          end
        else
          owner.in_database.rename_column(self.name.to_sym, THE_GEOM, :the_geom_str)
        end
      else # Ensure a the_geom column, of type point by default
        type = "point"
      end
    end
    return if type.nil?
    
    #if the geometry is MULTIPOINT we convert it to POINT
    if type.to_s.downcase == "multipoint"
      owner.in_database do |user_database|
        user_database.run("SELECT AddGeometryColumn('#{self.name}','the_geom_simple',4326, 'POINT', 2);")
        user_database.run("UPDATE #{self.name} SET the_geom_simple = ST_GeometryN(the_geom,1);")
        user_database.run("SELECT DropGeometryColumn('#{self.name}','the_geom');");
        user_database.run("ALTER TABLE #{self.name} RENAME COLUMN the_geom_simple TO the_geom;")
      end
      type = "point"
    end
    
    raise InvalidArgument unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)
    updates = false
    type = type.to_s.upcase
    owner.in_database do |user_database|
      return if !force_schema.blank? && !user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM)
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM)
        updates = true
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','#{THE_GEOM}',#{CartoDB::SRID},'#{type}',2)")
        user_database.run("CREATE INDEX ON #{self.name} USING GIST(the_geom)")
      end
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM_WEBMERCATOR)
        updates = true
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','#{THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{type}',2)")
        user_database.run("UPDATE #{self.name} SET #{THE_GEOM_WEBMERCATOR}=ST_Transform(#{THE_GEOM},#{CartoDB::GOOGLE_SRID}) WHERE #{THE_GEOM} IS NOT NULL")
        user_database.run("CREATE INDEX ON #{self.name} USING GIST(#{THE_GEOM_WEBMERCATOR})")

        # user_database.run("ALTER TABLE #{self.name} ADD CONSTRAINT geometry_valid_check CHECK (ST_IsValid(#{THE_GEOM}))")        
      end      
    end
    self.the_geom_type = type.downcase
    save_changes unless new?
    if updates
      set_trigger_the_geom_webmercator
    end
  end

  def create_table_in_database!
    self.name ||= get_valid_name(self.name)

    owner.in_database do |user_database|
      if force_schema.blank?
        user_database.create_table self.name.to_sym do
          column :cartodb_id, "SERIAL PRIMARY KEY"
          String :name
          String :description, :text => true
          DateTime :created_at, :default => "NOW()"
          DateTime :updated_at, :default => "NOW()"
        end
      else
        sanitized_force_schema = force_schema.split(',').map do |column|
          # Convert existing primary key into a unique key
          if column =~ /^\s*\"([^\"]+)\"(.*)$/
            "#{$1.sanitize} #{$2.gsub(/primary\s+key/i,"UNIQUE")}"
          else
            column.gsub(/primary\s+key/i,"UNIQUE")
          end
        end
        sanitized_force_schema.unshift("cartodb_id SERIAL PRIMARY KEY").
                               unshift("created_at timestamp").
                               unshift("updated_at timestamp")
        user_database.run(<<-SQL
CREATE TABLE #{self.name} (#{sanitized_force_schema.join(', ')});
alter table #{self.name} alter column created_at SET DEFAULT now();
alter table #{self.name} alter column updated_at SET DEFAULT now();
SQL
        )
      end
    end
  end

  def update_the_geom!(attributes, primary_key)
    return unless attributes[THE_GEOM]
    geo_json = RGeo::GeoJSON.decode(attributes[THE_GEOM], :json_parser => :json).try(:as_text)
    raise CartoDB::InvalidGeoJSONFormat if geo_json.nil?
    owner.in_database.run("UPDATE #{self.name} SET the_geom = ST_GeomFromText('#{geo_json}',#{CartoDB::SRID}) where cartodb_id = #{primary_key}")
  end

  def manage_tags
    if self[:tags].blank?
      Tag.filter(:user_id => user_id, :table_id => id).delete
    else
      tag_names = tags.split(',')
      table_tags = Tag.filter(:user_id => user_id, :table_id => id).all
      unless table_tags.empty?
        # Remove tags that are not in the new names list
        table_tags.each do |tag|
          unless tag_names.include?(tag.name)
            tag.destroy
          else
            tag_names.delete(tag.name)
          end
        end
      end
      # Create the new tags in the this table
      tag_names.each do |new_tag_name|
        new_tag = Tag.new :name => new_tag_name
        new_tag.user_id = user_id
        new_tag.table_id = id
        new_tag.save
      end
    end
  end

  def move_metadata_if_needed
    if @name_changed_from.present? && @name_changed_from != name
      $tables_metadata.rename(Table.key(database_name,@name_changed_from), key)
    end
    @name_changed_from = nil
  end

end
