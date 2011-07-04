# coding: UTF-8

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:privacy, :tags)

  attr_accessor :force_schema, :import_from_file,
                :importing_SRID, :importing_encoding, :temporal_the_geom_type

  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  RESERVED_COLUMN_NAMES = %W{ oid tableoid xmin cmin xmax cmax ctid }

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
    self.database_name = owner.database_name
    update_updated_at
    
    if import_from_file.present?
      importer = CartoDB::Importer.new ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        "database" => database_name, :logger => ::Rails.logger,
        "username" => owner.database_username, "password" => owner.database_password,
        :import_from_file => import_from_file, :suggested_name => self.name, :debug => (Rails.env.development?)
      ).symbolize_keys
      importer_result = importer.import!
      
      self[:name] = importer_result.name
      schema = self.schema(:reload => true)
      
      owner.in_database do |user_database|
        if schema.nil? || !schema.flatten.include?(:cartodb_id)
          user_database.run("alter table #{self.name} add column cartodb_id integer")
        end
        user_database.run("create sequence cartodb_id_#{oid}_seq")
        user_database.run("update #{self.name} set cartodb_id = nextval('cartodb_id_#{oid}_seq')")
        user_database.run("alter table #{self.name} alter column cartodb_id set default nextval('cartodb_id_#{oid}_seq')")
        user_database.run("alter table #{self.name} alter column cartodb_id set not null")
        user_database.run("alter table #{self.name} add unique (cartodb_id)")
        user_database.run("alter table #{self.name} drop constraint #{self.name}_cartodb_id_key restrict")
        user_database.run("alter table #{self.name} add primary key (cartodb_id)")
        if schema.nil? || !schema.flatten.include?(:created_at)
          user_database.run("alter table #{self.name} add column created_at timestamp DEFAULT now()")
        end
        if schema.nil? || !schema.flatten.include?(:updated_at)
          user_database.run("alter table #{self.name} add column updated_at timestamp DEFAULT now()")
        end
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
    
    super
  rescue => e
    unless self.name.blank?
      $tables_metadata.del key
      owner.in_database(:as => :superuser).run("DROP TABLE IF EXISTS #{self.name}")
    end
    raise e
  end

  def after_save
    super
    manage_tags
  end

  def after_create
    super
    owner.in_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
    User.filter(:id => user_id).update(:tables_count => :tables_count + 1)
    set_trigger_update_updated_at
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
      rescue
        Rails.logger.info "[Exception captured] Table#after_destroy: maybe table #{self.name} doesn't exist"
      end
      user_database.run("DROP TABLE IF EXISTS #{self.name}")
    end
  end
  ## End of Callbacks
  
  def name=(value)
    return if value == self[:name] || value.blank?
    new_name = get_valid_name(value)
    unless new?
      owner.in_database.rename_table name, new_name
    end
    self[:name] = new_name
  end

  def tags=(value)
    self[:tags] = value.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
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
        # owner.in_database.run("REVOKE SELECT ON #{self.name} FROM #{CartoDB::PUBLIC_DB_USER};")
        $tables_metadata.hset key, "privacy", PRIVATE
      end
    elsif value == "PUBLIC" || value == PUBLIC || value == PUBLIC.to_s
      self[:privacy] = PUBLIC
      unless new?
        $tables_metadata.hset key, "privacy", PUBLIC
        # owner.in_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      end
    end
  end

  def key
    "rails:#{database_name}:#{oid}"
  rescue
    nil
  end

  def rows_counted
    owner.in_database[name.to_sym].count
  end

  def schema(options = {})
    temporal_schema = []
    owner.in_database.schema(self.name, options.slice(:reload)).each do |column| 
      next if column[0] == THE_GEOM_WEBMERCATOR
      col = [ column[0], 
        column[0] == THE_GEOM ? "geometry" : (options[:cartodb_types] == false) ? column[1][:db_type] : column[1][:db_type].convert_to_cartodb_type, 
        column[0] == THE_GEOM ? "geometry" : nil, 
        column[0] == THE_GEOM ? the_geom_type : nil
      ].compact
      
      # Make sensible sorting for jamon 
      case column[0]
        when :cartodb_id
          temporal_schema.insert(0,col)
        when :created_at, :updated_at
          temporal_schema.insert(-1,col)
        else
          temporal_schema.insert(1,col)
      end
    end
    temporal_schema.compact
  end
  
  def insert_row!(raw_attributes)
    primary_key = nil
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      begin
        primary_key = user_database[name.to_sym].insert(attributes.except(THE_GEOM).convert_nulls)
      rescue Sequel::DatabaseError => e
        # If the type don't match the schema of the table is modified for the next valid type
        message = e.message.split("\n")[0]
        invalid_value = if m = message.match(/"([^"]+)"$/)
          m[1]
        else
          nil
        end
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
    return primary_key
  end

  def update_row!(row_id, raw_attributes)
    rows_updated = 0
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      if !attributes.except(THE_GEOM).empty?
        begin
          rows_updated = user_database[name.to_sym].filter(:cartodb_id => row_id).update(attributes.except(THE_GEOM).convert_nulls)
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          message = e.message.split("\n")[0]
          invalid_value = message.match(/"([^"]+)"$/)[1]
          invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
          if new_column_type = get_new_column_type(invalid_column)
            user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
            retry
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
      raise CartoDB::InvalidType.new(e.message)
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
    page, per_page = CartoDB::Pagination.get_page_and_per_page(options)
    order_by_column = options[:order_by] || "cartodb_id"
    mode = (options[:mode] || 'asc').downcase == 'asc' ? 'asc' : 'desc'
    owner.in_database do |user_database|
      select = if schema.flatten.include?(THE_GEOM)
        schema.map{ |c| c[0] == THE_GEOM ? "ST_AsGeoJSON(the_geom,6) as the_geom" : c[0]}.join(',')
      else
        schema.map{|c| c[0] }.join(',')
      end
      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      rows = user_database["SELECT #{select} FROM public.#{name} ORDER BY #{order_by_column} #{mode} LIMIT #{per_page} OFFSET #{page}"].all
    end
    {
      :id         => id,
      :name       => name,
      :total_rows => rows_counted,
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
        user_database.run("UPDATE #{self.name} SET the_geom = ST_GeomFromText('POINT(' || #{options[:longitude_column]} || ' ' || #{options[:latitude_column]} || ')',#{CartoDB::SRID})")
        user_database.run("ALTER TABLE #{self.name} DROP COLUMN #{options[:longitude_column]}")
        user_database.run("ALTER TABLE #{self.name} DROP COLUMN #{options[:latitude_column]}")
      end
      schema(:reload => true)
    else
      raise InvalidArgument
    end
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
    if key.blank?
      self.temporal_the_geom_type = the_geom_type_value
    else
      $tables_metadata.hset(key,"the_geom_type",the_geom_type_value)
    end
  end

  def to_csv
    csv_zipped = nil
    owner.in_database do |user_database|
      table_name = "csv_export_temp_#{self.name}"
      file_name = "#{self.name}_export"
      csv_file_path = Rails.root.join('tmp', "#{file_name}.csv")
      zip_file_path  = Rails.root.join('tmp', "#{file_name}.zip")
      FileUtils.rm_rf(zip_file_path)
      FileUtils.rm_rf(csv_file_path)

      user_database.run("DROP TABLE IF EXISTS #{table_name}")
      
      export_schema = self.schema.map{|c| c.first} - [THE_GEOM]
      export_schema += ["ST_AsGeoJSON(the_geom, 6) as the_geom"] if self.schema.map{|c| c.first}.include?(THE_GEOM)
      user_database.run("CREATE TABLE #{table_name} AS SELECT #{export_schema.join(',')} FROM #{self.name}")

      db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
      host     = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
      port     = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
      username = db_configuration['username']
      command  = "COPY (SELECT * FROM #{table_name}) TO STDOUT WITH DELIMITER ',' CSV QUOTE AS '\\\"' HEADER"
      Rails.logger.info "Executing command: #{%Q{`which psql` #{host} #{port} -U#{username} -w #{database_name} -c"#{command}" > #{csv_file_path};}}"
      system <<-CMD
        `which psql` #{host} #{port} -U#{username} -w #{database_name} -c"#{command}" > #{csv_file_path}
      CMD
      user_database.run("DROP TABLE #{table_name}")
      
      Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
        zipfile.add(File.basename(csv_file_path), csv_file_path)
      end
      csv_zipped = File.read(zip_file_path)
      FileUtils.rm_rf(csv_file_path)
      FileUtils.rm_rf(zip_file_path)
    end
    csv_zipped
  end

  def to_shp
    shp_files_name = "#{self.name}_export"
    all_files_path = Rails.root.join('tmp', "#{shp_files_name}.*")
    shp_file_path  = Rails.root.join('tmp', "#{shp_files_name}.shp")
    zip_file_path  = Rails.root.join('tmp', "#{shp_files_name}.zip")

    db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
    host     = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
    port     = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
    username = db_configuration['username']
    Rails.logger.info "Executing command: #{%Q{`which pgsql2shp` #{host} #{port} -u #{username} -f #{shp_file_path} #{database_name} #{self.name}}}"
    system <<-CMD
      rm -rf #{all_files_path};
      `which pgsql2shp` #{host} #{port} -u #{username} -f #{shp_file_path} #{database_name} #{self.name}
    CMD
    Zip::ZipFile.open(zip_file_path, Zip::ZipFile::CREATE) do |zipfile|
      Dir.glob(Rails.root.join('tmp',"#{shp_files_name}.*").to_s).each do |f|
        zipfile.add(File.basename(f), f)
      end
    end
    response = File.read(zip_file_path)
    FileUtils.rm_rf(shp_file_path)
    FileUtils.rm_rf(zip_file_path)
    response
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
    table = if identifier =~ /\A\d+\Z/ || identifier.is_a?(Fixnum)
      Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id order by tags.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? and user_tables.id = ?", user_id, identifier).all.first
    else
      Table.fetch("select *, array_to_string(array(select tags.name from tags where tags.table_id = user_tables.id order by tags.id),',') as tags_names
                          from user_tables
                          where user_tables.user_id = ? and user_tables.name = ?", user_id, identifier).all.first    end
    raise RecordNotFound if table.nil?
    table
  end

  def oid
    @oid ||= owner.in_database["SELECT '#{self.name}'::regclass::oid"].first[:oid]
  end

  private

  def update_updated_at
    self.updated_at = Time.now
  end

  def update_updated_at!
    update_updated_at && save_changes
  end

  def owner
    User.select(:id,:database_name,:crypted_password).filter(:id => self.user_id).first
  end

  def get_valid_name(raw_new_name = nil)
    raw_new_name = (raw_new_name || "Untitle table").sanitize
    raw_new_name = "table_#{raw_new_name}" if raw_new_name =~ /^[0-9]/
    raw_new_name = "table#{raw_new_name}" if raw_new_name =~ /^_/
    candidates = owner.in_database.tables.map{ |t| t.to_s }.select{ |t| t.match(/^#{raw_new_name}/) }
    
    return raw_new_name unless candidates.include?(raw_new_name)
    
    max_candidate = candidates.max
    if max_candidate =~ /(.+)_(\d+)$/
      return $1 + "_#{$2.to_i +  1}"
    else
      return max_candidate + "_2"
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
        type = owner.in_database["select GeometryType(the_geom) FROM #{self.name} where the_geom is not null limit 1"].first[:geometrytype]
      end
    end
    return if type.nil?
    raise InvalidArgument unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)
    updates = false
    type = type.to_s.upcase
    owner.in_database do |user_database|
      return if !force_schema.blank? && !user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM)
      # REVIEW
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM)
        updates = true
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','#{THE_GEOM}',#{CartoDB::SRID},'#{type}',2)")
        user_database.run("CREATE INDEX ON #{self.name} USING GIST(the_geom)")
      end
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM_WEBMERCATOR)
        updates = true
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','#{THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{type}',2)")
        user_database.run("CREATE INDEX ON #{self.name} USING GIST(#{THE_GEOM_WEBMERCATOR})")
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
  
end