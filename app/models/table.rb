# coding: UTF-8
# Proxies management of a table in the users database
class Table < Sequel::Model(:user_tables)

  # Table constants
  PRIVATE = 0
  PUBLIC  = 1
  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  RESERVED_COLUMN_NAMES = %W{ oid tableoid xmin cmin xmax cmax ctid ogc_fid }
  
  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:privacy, :tags)

  attr_accessor :force_schema, :import_from_file,:import_from_url, :import_from_query, 
                :import_from_table_copy, :importing_SRID, :importing_encoding, 
                :temporal_the_geom_type, :migrate_existing_table

  ## Callbacks
  
  # Core validation method that is automatically called before create and save
  def validate
    super
    
    ## SANITY CHECKS

    # userid and table name tuple must be unique
    validates_unique [:name, :user_id], :message => 'is already taken'

    # tables must have a user
    errors.add(:user_id, "can't be blank") if user_id.blank?
  
    # privacy setting must be a sane value
    errors.add(:privacy, 'has an invalid value') if privacy != PRIVATE && privacy != PUBLIC


    ## QUOTA CHECKS

    # tables cannot be created if the owner has no more table quota
    if self.new? && self.owner.over_table_quota?
      
      # Add basic error to user response
      errors.add(nil, 'over table quota, please upgrade')       
      
      # Add error to data_import object log
      @data_import ||= DataImport.find(:id => self.data_import_id) # note memoize function
      @data_import.set_error_code(8002)
      @data_import.log_error('over table quota, please upgrade')      
    end
      
    # Branch if owner dows not have private table privileges
    if !self.owner.try(:private_tables_enabled) 
      
      # If it's a new table and the user is trying to make it private
      if self.new? && privacy == PRIVATE
        errors.add(:privacy, 'unauthorized to create private tables')          
      end
      
      # if the table exists, is private, but the owner no longer has private privalidges
      # basically, this should never happen.
      if !self.new? && privacy == PRIVATE && self.changed_columns.include?(:privacy)
        errors.add(:privacy, 'unauthorized to modify privacy status to private') 
      end  
    end
  end

  # runs before each validation phase on create and update
  def before_validation  
    # ensure privacy variable is set to one of the constants. this is bad.
    self.privacy ||= owner.private_tables_enabled ? PRIVATE : PUBLIC  
    super
  end
  
  def append_to_table(options) 
    from_table = options[:from_table]
    self.database_name = owner.database_name   
    append_to_table = self
    # if concatenate_to_table is set, it will join the table just created
    # to the table named in concatenate_to_table and then drop the created table
    #get schemas of uploaded and existing tables
    new_schema = from_table.schema(:reload => true)
    new_schema_hash = Hash[new_schema]
    new_schema_names = new_schema.collect {|x| x[0]}
  
    existing_schema_hash = Hash[append_to_table.schema(:reload => true)]
    
    # fun schema check here
    drop_names = %W{ cartodb_id created_at updated_at ogc_fid}
    new_schema_hash.keys.each do |column_name|
      if RESERVED_COLUMN_NAMES.include?(column_name.to_s) or drop_names.include?column_name.to_s
        new_schema_names.delete(column_name)
      elsif column_name.to_s != 'the_geom'
        if existing_schema_hash.keys.include?(column_name)
          # column name exists in new and old table
          if existing_schema_hash[column_name] != new_schema_hash[column_name]
            #the new column type does not match the existing, force change to existing
            hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
              :type => existing_schema_hash[column_name], 
              :name => column_name
            ).symbolize_keys
            self.modify_column! hash_in
          end
        else
          # add column and type to old table
            hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
              :type => new_schema_hash[column_name], 
              :name => column_name
            ).symbolize_keys
          append_to_table.add_column! hash_in
        end
      end
    end
    # append table 2 to table 1
    owner.in_database.run("INSERT INTO #{append_to_table.name} (#{new_schema_names.join(',')}) (SELECT #{new_schema_names.join(',')} FROM #{from_table.name})")
    # so that we can use the same method to allow the user to merge two tables
    # that already exist in the API
    # a future might be merge_two_tables
    # => where tableA is duplicated
    # => then tableB is append_to_table onto tableA
    # => leaving both in tact while creating a new tthat contains both
  end
  
  
  def import_to_cartodb
      if import_from_file.present?     
        @data_import.data_type = 'file'
        @data_import.data_source = import_from_file
        @data_import.upload
        @data_import.save
        
        hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          "database" => database_name, 
          :logger => ::Rails.logger,
          "username" => owner.database_username, 
          "password" => owner.database_password,
          :import_from_file => import_from_file, 
          :debug => (Rails.env.development?), 
          :remaining_quota => owner.remaining_quota,
          :data_import_id => @data_import.id
        ).symbolize_keys

        importer = CartoDB::Importer.new hash_in
        importer = importer.import!
        @data_import.reload
        @data_import.imported
        return importer.name
      end
      #import from URL
      if import_from_url.present?   
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
      if import_from_query.present? 
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
        set_trigger_the_geom_webmercator
        return importer.name
      end
      #Register a table not created throug the UI
      if migrate_existing_table.present?
        @data_import.data_type = 'external_table'
        @data_import.data_source = migrate_existing_table
        @data_import.migrate
        @data_import.save
                
        # ensure unique name
        uniname = get_valid_name(migrate_existing_table)
        
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
      if import_from_table_copy.present?
        @data_import.data_type = 'table'
        @data_import.data_source = migrate_existing_table
        @data_import.migrate
        @data_import.save
        # ensure unique name
        uniname = get_valid_name(self.name)
        owner.in_database.run("CREATE TABLE #{uniname} AS SELECT * FROM #{import_from_table_copy}")
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
  
  def import_cleanup
    owner.in_database do |user_database|
      # If we already have a cartodb_id column let's rename it to an auxiliary column
      aux_cartodb_id_column = nil
      if schema.present? && schema.flatten.include?(:cartodb_id)
         aux_cartodb_id_column = "cartodb_id_aux_#{Time.now.to_i}"
         user_database.run("ALTER TABLE #{self.name} RENAME COLUMN cartodb_id TO #{aux_cartodb_id_column}")
         @data_import.log_update('renaming cartodb_id from import file')
         self.schema
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
          @data_import.log_update('removing ogc_fid from import file')
        end
      end
      if schema.present? && schema.flatten.include?(:gid)
        if aux_cartodb_id_column.nil?
          aux_cartodb_id_column = "gid"
        else
          user_database.run("ALTER TABLE #{self.name} DROP COLUMN gid")
          @data_import.log_update('removing gid from import file')
        end
      end
      self.schema(:reload => true, :cartodb_types => false).each do |column|
        if column[1] =~ /^character varying/
          user_database.run("ALTER TABLE #{self.name} ALTER COLUMN \"#{column[0]}\" TYPE text")
        end
      end
      schema = self.schema(:reload => true)
      
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
        @data_import.log_update('cleaning supplied cartodb_id')
      end
      user_database.run("ALTER TABLE #{self.name} ADD PRIMARY KEY (cartodb_id)")

      normalize_timestamp_field!(:created_at, user_database)
      normalize_timestamp_field!(:updated_at, user_database)
    end
  end
  
  def before_create
    update_updated_at
    self.database_name = owner.database_name    
    
    #import from file
    if import_from_file.present? or import_from_url.present? or import_from_query.present? or import_from_table_copy.present? or migrate_existing_table.present?
      
      #init state machine
      if self.data_import_id.nil? #needed for non ui-created tables
        @data_import  = DataImport.new(:user_id => self.user_id)
        @data_import.updated_at = Time.now
        @data_import.save
      else
        @data_import  = DataImport.find(:id=>self.data_import_id)
      end
      
      importer_result_name = import_to_cartodb
      
      @data_import.reload
      @data_import.table_name = importer_result_name
      @data_import.save
      
      self[:name] = importer_result_name
      
      schema = self.schema(:reload => true)

      import_cleanup
      set_the_geom_column!
      @data_import.formatted
      @data_import.save
    else
      create_table_in_database!
      if !self.temporal_the_geom_type.blank?
        self.the_geom_type = self.temporal_the_geom_type
        self.temporal_the_geom_type = nil
      end
      set_the_geom_column!(self.the_geom_type)
    end
    
    
    # test for exceeding of table quota after creation - needed as no way to test future db size pre-creation
    if owner.over_disk_quota?
      unless @data_import.nil?
        @data_import.reload
        @data_import.set_error_code(8001)
        @data_import.log_error("#{owner.disk_quota_overspend / 1024}KB more space is required" )
      end   
      raise CartoDB::QuotaExceeded, "#{owner.disk_quota_overspend / 1024}KB more space is required" 
    end

    # all looks ok, so ANALYZE for correct statistics
    owner.in_database.run("ANALYZE \"#{self.name}\"")
      
    # TODO: insert geometry checking and fixing here https://github.com/Vizzuality/cartodb/issues/511
    super
    if @data_import
      CartodbStats.increment_imports()
    end
  rescue => e
    CartoDB::Logger.info "table#create error", "#{e.inspect}"   
    if @data_import
      @data_import.reload
      @data_import.log_error("Table error, #{e.inspect}")
      @data_import.set_error_code(8003) if e.message.to_s =~ /statement timeout/
    end   
    unless self.name.blank?
      $tables_metadata.del key
      owner.in_database(:as => :superuser).run("DROP TABLE IF EXISTS #{self.name}")
      if @data_import
        @data_import.log_update("dropping table #{self.name}")
      end   
    end

    if @import_from_file
      @import_from_file = URI.escape(@import_from_file) if @import_from_file =~ /^http/
      open(@import_from_file) do |res|
        filename = "#{File.basename(@import_from_file).split('.').first}_#{Time.now.to_i}#{File.extname(@import_from_file)}"
        @import_from_file = File.new Rails.root.join('public', 'uploads', 'failed_imports', filename), 'w'
        @import_from_file.write res.read.force_encoding('utf-8')
        @import_from_file.close
      end
        
      if @data_import
        @data_import.log_error("Import Error: #{e.try(:message)}")
        CartodbStats.increment_failed_imports()
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

  def after_save
    super
    manage_tags
    update_name_changes
    manage_privacy
  end

  def after_create
    super
    User.filter(:id => user_id).update(:tables_count => :tables_count + 1)
    owner.in_database(:as => :superuser).run("GRANT SELECT ON #{self.name} TO #{CartoDB::TILE_DB_USER};")
    add_python
    delete_tile_style
    flush_cache    
    set_trigger_update_updated_at
    set_trigger_cache_timestamp
    set_trigger_check_quota
    set_default_table_privacy
    # make_geom_valid # too expensive to do on import, leave to the user
    
    @force_schema = nil
    $tables_metadata.hset key, "user_id", user_id
    
    update_table_pg_stats
    
    # finally, close off the data import
    if data_import_id
      @data_import = DataImport.find(:id=>data_import_id)
      @data_import.table_id = id
      @data_import.finished
    end
    add_table_to_stats
  end
  
  def after_update
    flush_cache
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
    remove_table_from_stats
  end
  ## End of Callbacks


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
  
  
  def make_geom_valid
    begin 
      # make timeout here long, but not infinite. 10mins = 600000 ms. 
      # TODO: extend .run to take a "long_running" indicator? See #730.
      owner.in_database.run("SET statement_timeout TO 600000;UPDATE #{self.name} SET the_geom = ST_MakeValid(the_geom);SET statement_timeout TO DEFAULT")
    rescue => e
      CartoDB::Logger.info "Table#make_geom_valid error", "table #{self.name} make valid failed: #{e.inspect}"
    end
  end
  

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

  def set_default_table_privacy
    self.privacy ||= self.owner.try(:private_tables_enabled) ? PRIVATE : PUBLIC
    save
  end
    
  def manage_privacy
    if privacy == PRIVATE
      owner.in_database(:as => :superuser).run("REVOKE SELECT ON #{self.name} FROM #{CartoDB::PUBLIC_DB_USER};")
      $tables_metadata.hset key, "privacy", PRIVATE
    elsif privacy == PUBLIC
      owner.in_database(:as => :superuser).run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      $tables_metadata.hset key, "privacy", PUBLIC 
    end        
  end

  # enforce standard format for this field
  def privacy=(value)
    if value == "PRIVATE" || value == PRIVATE || value == PRIVATE.to_s
      self[:privacy] = PRIVATE
    elsif value == "PUBLIC" || value == PUBLIC || value == PUBLIC.to_s
      self[:privacy] = PUBLIC
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

  def rows_estimated_query(query)
    owner.in_database do |user_database|
      rows = user_database["EXPLAIN #{query}"].all
      est = Integer( rows[0].to_s.match( /rows=(\d+)/ ).values_at( 1 )[0] )
      return est
    end
  end

  def rows_estimated
    owner.in_database["SELECT reltuples::integer FROM pg_class WHERE oid = '#{self.name}'::regclass"].first[:reltuples];
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
        primary_key = user_database[name.to_sym].insert(make_sequel_compatible(attributes))
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
          # update row
          rows_updated = user_database[name.to_sym].filter(:cartodb_id => row_id).update(make_sequel_compatible(attributes))
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          # TODO: STOP THIS MADNESS
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

  # make all identifiers SEQUEL Compatible
  # https://github.com/Vizzuality/cartodb/issues/331
  def make_sequel_compatible attributes
    attributes.except(THE_GEOM).convert_nulls.each_with_object({}) { |(k, v), h| h[k.identifier] = v }
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
              convert_column_datatype user_database, name, column_name, new_type
            rescue => e              
              raise e
            end
          else
            raise e
          end
        end
      end
    end
    return {:name => new_name, :type => new_type, :cartodb_type => cartodb_type}
  end

  # convert non-conformist rows to null
  def convert_column_datatype user_database, table_name, column_name, new_type        
    begin
      # try straight cast
      user_database.transaction do                
        user_database.run(<<-EOF
          ALTER TABLE #{table_name} 
          ALTER COLUMN #{column_name} 
          TYPE #{new_type} 
          USING cast(#{column_name} as #{new_type})
          EOF
        )  
      end
    rescue => e
      # attempt various lossy conversions by regex nullifying unmatching data and retrying conversion.
      user_database.transaction do
        old_type = col_type(user_database, table_name, column_name).to_s        

        # conversions ok by default
        # number => string
        # boolean => string        
                
        # string => number
        if (old_type == 'string' && new_type == 'double precision')                    
          # normalise number
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}=NULL 
            WHERE trim(\"#{column_name}\") !~* '^([-+]?[0-9]+(\.[0-9]+)?)$'
            EOF
          )
        end
                    
        # string => boolean
        if (old_type == 'string' && new_type == 'boolean')
          falsy = "0|f|false"

          # normalise empty string to NULL
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}=NULL
            WHERE trim(\"#{column_name}\") ~* '^$'
            EOF
          )          

          # normalise truthy (anything not false and NULL is true...)
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='t' 
            WHERE trim(\"#{column_name}\") !~* '^(#{falsy})$' AND #{column_name} IS NOT NULL
            EOF
          )

          # normalise falsy
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='f'
            WHERE trim(\"#{column_name}\") ~* '^(#{falsy})$'
            EOF
          )                    
        end      

        # boolean => number
        # normalise truthy to 1, falsy to 0
        if (old_type == 'boolean' && new_type == 'double precision')
          
          # first to string
          user_database.run(<<-EOF
            ALTER TABLE #{table_name} 
            ALTER COLUMN #{column_name} TYPE text 
            USING cast(#{column_name} as text)
            EOF
          )
                    
          # normalise truthy
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='1' 
            WHERE #{column_name} = 'true' AND #{column_name} IS NOT NULL
            EOF
          )

          # normalise falsy
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='0' 
            WHERE #{column_name} = 'false' AND #{column_name} IS NOT NULL
            EOF
          )
        end
        
        
        # number => boolean
        # normalise 0 to falsy else truthy        
        if (old_type == 'float' && new_type == 'boolean')
          
          # first to string
          user_database.run(<<-EOF
            ALTER TABLE #{table_name} 
            ALTER COLUMN #{column_name} TYPE text 
            USING cast(#{column_name} as text)
            EOF
          )                  

          # normalise truthy
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='t' 
            WHERE #{column_name} !~* '^0$' AND #{column_name} IS NOT NULL
            EOF
          )

          # normalise falsy
          user_database.run(<<-EOF
            UPDATE #{table_name} 
            SET #{column_name}='f'
            WHERE #{column_name} ~* '^0$'
            EOF
          )
        end
              
        # TODO: 
        # * string  => datetime 
        # * number  => datetime 
        # * boolean => datetime               
        # 
        # Maybe do nothing? Does it even make sense? Best to throw error here for now.
                    
        # try to update normalised column to new type (if fails here, well, we have not lost anything)
        user_database.run(<<-EOF
          ALTER TABLE #{table_name} 
          ALTER COLUMN #{column_name} 
          TYPE #{new_type} 
          USING cast(#{column_name} as #{new_type})
          EOF
        )  
      end
    end    
  end
  
  def col_type user_database, table_name, column_name
    user_database.schema(table_name).select{ |c| c[0] == column_name.to_sym }.flatten.last[:type]
  end  

  def records(options = {})
    rows = []
    records_count = 0
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

      # Counting results can be really expensive, so we estimate
      #
      # See https://github.com/Vizzuality/cartodb/issues/716
      #
      max_countable_rows = 65535 # up to this number we accept to count
      rows_count = 0
      rows_count_is_estimated = true
      if filters.present?
        query = "SELECT cartodb_id as total_rows FROM #{name} #{where} "
        rows_count = rows_estimated_query(query)
        if rows_count <= max_countable_rows
          query = "SELECT COUNT(cartodb_id) as total_rows FROM #{name} #{where} "
          rows_count = user_database[query].get(:total_rows)
          rows_count_is_estimated = false
        end
      else
        rows_count = rows_estimated
        if rows_count <= max_countable_rows
          rows_count = rows_counted
          rows_count_is_estimated = false
        end
      end

      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      #
      # NOTE: we fetch one more row to verify estimated rowcount is not short
      #
      rows = user_database["SELECT #{select_columns} FROM #{name} #{where} ORDER BY \"#{order_by_column}\" #{mode} LIMIT #{per_page}+1 OFFSET #{page}"].all
      CartoDB::Logger.info "Query", "fetch: #{rows.length}"

      # Tweak estimation if needed
      fetched = rows.length
      fetched += page if page

      have_more = rows.length > per_page
      rows.pop if have_more

      records_count = rows_count
      if rows_count_is_estimated
        if have_more
          records_count = fetched > rows_count ? fetched : rows_count
        else
          records_count = fetched
        end
      end

      # TODO: cache row count !!
      # See https://github.com/Vizzuality/cartodb/issues/459


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
    v = owner.run_query(query)
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

  def to_kml
    owner.in_database do |user_database|  
      export_schema = self.schema.map{|c| c.first}
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :table_name => self.name, 
        :export_type => "kml", 
        :export_schema => export_schema,
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota
      ).symbolize_keys

      exporter = CartoDB::Exporter.new hash_in
    
      return exporter.export! 
    end
  end
  def to_csv
    owner.in_database do |user_database|  
      #table_name = "csv_export_temp_#{self.name}"
      export_schema = self.schema.map{|c| c.first} - [THE_GEOM]
      export_schema += ["ST_AsGeoJSON(the_geom, 6) as the_geom"] if self.schema.map{|c| c.first}.include?(THE_GEOM)
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :table_name => self.name, 
        :export_type => "csv", 
        :export_schema => export_schema,
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota
      ).symbolize_keys

      exporter = CartoDB::Exporter.new hash_in
    
      return exporter.export! 
    end
  end
  def to_shp
    owner.in_database do |user_database|  
      export_schema = self.schema.map{|c| c.first}
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :table_name => self.name, 
        :export_type => "shp", 
        :export_schema => export_schema,
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota
      ).symbolize_keys

      exporter = CartoDB::Exporter.new hash_in
    
      return exporter.export! 
    end
  end
  def to_sql
    owner.in_database do |user_database|  
      export_schema = self.schema.map{|c| c.first}
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, 
        :logger => ::Rails.logger,
        "username" => owner.database_username, 
        "password" => owner.database_password,
        :table_name => self.name, 
        :export_type => "sql", 
        :export_schema => export_schema,
        :debug => (Rails.env.development?), 
        :remaining_quota => owner.remaining_quota
      ).symbolize_keys

      exporter = CartoDB::Exporter.new hash_in
    
      return exporter.export! 
    end
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
    return true unless self.schema(:reload => true).flatten.include?(THE_GEOM)
    owner.in_database(:as => :superuser) do |user_database|      
      user_database.run(<<-TRIGGER
        DROP TRIGGER IF EXISTS update_the_geom_webmercator_trigger ON #{self.name};
        CREATE OR REPLACE FUNCTION update_the_geom_webmercator() RETURNS trigger AS $update_the_geom_webmercator_trigger$
          BEGIN
                NEW.#{THE_GEOM_WEBMERCATOR} := CDB_TransformToWebmercator(NEW.the_geom);
                --NEW.#{THE_GEOM_WEBMERCATOR} := ST_Transform(NEW.the_geom,#{CartoDB::GOOGLE_SRID});
                RETURN NEW;
          END;
        $update_the_geom_webmercator_trigger$ LANGUAGE plpgsql VOLATILE COST 100;

        CREATE TRIGGER update_the_geom_webmercator_trigger
        BEFORE INSERT OR UPDATE OF the_geom ON #{self.name}
           FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();
  TRIGGER
        )
    end  
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

    varnish_host = APP_CONFIG[:varnish_management].try(:[],'host') || '127.0.0.1'
    varnish_port = APP_CONFIG[:varnish_management].try(:[],'port') || 6082

    owner.in_database(:as => :superuser).run(<<-TRIGGER
    CREATE OR REPLACE FUNCTION update_timestamp() RETURNS trigger AS
    $$
        if 'varnish' not in GD:
            import varnish
            try:
              GD['varnish'] = varnish.VarnishHandler(('#{varnish_host}', #{varnish_port}))
            except:
              #some error ocurred
              pass
        client = GD.get('varnish', None)

        table_name = TD["table_name"]
        if client:
          try:
            client.fetch('purge obj.http.X-Cache-Channel ~ "^#{self.database_name}:(.*%s.*)|(table)$"' % table_name)
          except:
            # try again
            import varnish
            try:
              client = GD['varnish'] = varnish.VarnishHandler(('#{varnish_host}', #{varnish_port}))
              client.fetch('purge obj.http.X-Cache-Channel == #{self.database_name}')
            except:
              pass
    $$
    LANGUAGE 'plpythonu' VOLATILE;

    DROP TRIGGER IF EXISTS cache_checkpoint ON #{self.name};
    CREATE TRIGGER cache_checkpoint BEFORE UPDATE OR INSERT OR DELETE OR TRUNCATE ON #{self.name} EXECUTE PROCEDURE update_timestamp();
TRIGGER
    )
  end

  # move to C
  def update_table_pg_stats
    owner.in_database["ANALYZE #{self.name};"]
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
    @owner ||= User.select(:id,:database_name,:crypted_password,:quota_in_bytes,:username, :private_tables_enabled, :table_quota, :account_type).filter(:id => self.user_id).first
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
    
    #if the geometry is LINESTRING or POLYGON we convert it to MULTILINESTRING and MULTIPOLYGON resp.
    if ["linestring","polygon"].include?(type.to_s.downcase)
      owner.in_database do |user_database|
        if type.to_s.downcase == 'polygon'
          user_database.run("SELECT AddGeometryColumn('#{self.name}','the_geom_simple',4326, 'MULTIPOLYGON', 2);")
        else
          user_database.run("SELECT AddGeometryColumn('#{self.name}','the_geom_simple',4326, 'MULTILINESTRING', 2);")
        end
        user_database.run("UPDATE #{self.name} SET the_geom_simple = ST_Multi(the_geom);")
        user_database.run("SELECT DropGeometryColumn('#{self.name}','the_geom');");
        user_database.run("ALTER TABLE #{self.name} RENAME COLUMN the_geom_simple TO the_geom;")
        type = owner.in_database["select GeometryType(#{THE_GEOM}) FROM #{self.name} where #{THE_GEOM} is not null limit 1"].first[:geometrytype]
      end
    end
    
    raise "Error: unsupported geometry type #{type.to_s.downcase} in CartoDB" unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)
    #raise InvalidArgument unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)
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
        # make timeout here long, but not infinite. 10mins = 600000 ms. 
        user_database.run("SET statement_timeout TO 600000;UPDATE #{self.name} SET #{THE_GEOM_WEBMERCATOR}=CDB_TransformToWebmercator(#{THE_GEOM}) WHERE #{THE_GEOM} IS NOT NULL;SET statement_timeout TO DEFAULT")        
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
          DateTime :created_at, :default => Sequel::CURRENT_TIMESTAMP
          DateTime :updated_at, :default => Sequel::CURRENT_TIMESTAMP
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
    # TODO: use this once the server geojson is updated
    # begin
    #   owner.in_database.run("UPDATE #{self.name} SET the_geom = ST_SetSRID(ST_GeomFromGeoJSON('#{attributes[THE_GEOM].sanitize_sql}'),#{CartoDB::SRID}) where cartodb_id = #{primary_key}")
    # rescue => e
    #   raise CartoDB::InvalidGeoJSONFormat
    # end    

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

  def update_name_changes
    if @name_changed_from.present? && @name_changed_from != name
      # update metadata records
      $tables_metadata.rename(Table.key(database_name,@name_changed_from), key)
      
      # update tile styles
      begin
        # get old tile style
        old_style = tile_request('GET', "/tiles/#{@name_changed_from}/style?map_key=#{owner.get_map_key}").try(:body)
       
        # parse old CartoCSS style out
        old_style = JSON.parse(old_style).with_indifferent_access[:style]

        # rename common table name based variables
        old_style.gsub!(@name_changed_from, self.name)      
        
        # post new style
        tile_request('POST', "/tiles/#{self.name}/style?map_key=#{owner.get_map_key}", {"style" => old_style})
      rescue => e
        CartoDB::Logger.info "tilestyle#rename error for", "#{e.inspect}"      
      end        
    end
    @name_changed_from = nil
  end

  def delete_tile_style
    begin
      tile_request('DELETE', "/tiles/#{self.name}/style?map_key=#{owner.get_map_key}")
    rescue => e
      CartoDB::Logger.info "tilestyle#delete error", "#{e.inspect}"      
    end  
  end  
  
  def flush_cache
    begin
      tile_request('DELETE', "/tiles/#{self.name}/flush_cache?map_key=#{owner.get_map_key}")
    rescue => e
      CartoDB::Logger.info "cache#flush error", "#{e.inspect}"      
    end        
  end

  def tile_request(request_method, request_uri, form = {})
    uri  = "#{owner.username}.#{APP_CONFIG[:tile_host]}"
    ip   = APP_CONFIG[:tile_ip] || '127.0.0.1'
    port = APP_CONFIG[:tile_port] || 80
    http_req = Net::HTTP.new ip, port
    request_headers = {'Host' => "#{owner.username}.#{APP_CONFIG[:tile_host]}"}
    case request_method
      when 'GET'
        http_res = http_req.request_get(request_uri, request_headers)
      when 'POST'
        http_res = http_req.request_post(request_uri, URI.encode_www_form(form), request_headers)
      when 'DELETE'
        extra_delete_headers = {'Depth' => 'Infinity'}
        http_res = http_req.delete(request_uri, request_headers.merge(extra_delete_headers)) 
      else
    end
    http_res
  end

  def add_table_to_stats
    CartodbStats.update_tables_counter(1)
    CartodbStats.update_tables_counter_per_user(1, self.owner.username)
    CartodbStats.update_tables_counter_per_host(1)
    CartodbStats.update_tables_counter_per_plan(1, self.owner.account_type)
  end

  def remove_table_from_stats
    CartodbStats.update_tables_counter(-1)
    CartodbStats.update_tables_counter_per_user(-1, self.owner.username)
    CartodbStats.update_tables_counter_per_host(-1)
    CartodbStats.update_tables_counter_per_plan(-1, self.owner.account_type)
  end

end
