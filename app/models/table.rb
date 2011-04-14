# coding: UTF-8

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:name, :privacy, :tags)

  attr_accessor :force_schema, :import_from_file, 
                :imported_table_name, :importing_SRID,
                :importing_encoding

  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  SKIP_SCHEMA_COLUMNS = [THE_GEOM_WEBMERCATOR, :cartodb_id, :created_at, :updated_at]

  ## Callbacks
  def validate
    super
    errors.add(:user_id, 'can\'t be blank') if user_id.blank?
    errors.add(:privacy, 'has an invalid value') if privacy != PRIVATE && privacy != PUBLIC
    errors.add(:the_geom_type, 'has an invalid value') unless CartoDB::VALID_GEOMETRY_TYPES.include?(the_geom_type.downcase)
    validates_unique [:name, :user_id], :message => 'is already taken'
  end

  def before_validation
    self.privacy ||= PRIVATE
    self.the_geom_type ||= "point"
    super
  end
  
  # Before creating a user table a table should be created in the database.
  # A serie of steps should be done:
  #  - set the new updated_at value
  #  - if the table is created and imported from a file
  #    - convert the file to a well known format
  #    - read or guess the schema
  #  - set the cartodb schema, adding cartodb primary key, etc..
  #  - import the data if necessary
  def before_create
    self.database_name = owner.database_name
    update_updated_at
    unless import_from_file.blank?
      handle_import_file!
      guess_schema if force_schema.blank? && imported_table_name.blank?
    end
    # Before assign the name, the method #key can not be used,
    # because depends on the name of the table
    self.name = set_table_name if self.name.blank?
    set_table_schema!
    if !import_from_file.blank? && imported_table_name.blank?
      import_data_from_file!
    end
    $tables_metadata.hset key, "privacy", self.privacy || PRIVATE
    super
  rescue Sequel::DatabaseError => e
    owner.in_database(:as => :superuser) do |user_database|
      user_database.run("DROP TABLE IF EXISTS #{self.name}")
      user_database.run("DROP SEQUENCE IF EXISTS #{self.name}_cartodb_id_seq")
    end
    raise e
  end

  def after_save
    super
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

  def after_create
    super
    User.filter(:id => user_id).update(:tables_count => :tables_count + 1)
    unless private?
      owner.in_database do |user_database|
        user_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      end
    end
    set_the_geom_column!(the_geom_type.try(:to_sym) || "point")
    set_trigger_update_updated_at
    update_stored_schema!
    self.force_schema = nil
    $tables_metadata.hset key, "user_id", user_id
    $tables_metadata.hset key, "privacy", self.privacy
  end
  
  def before_destroy
    $tables_metadata.del key
  end
  
  def after_destroy
    super
    Tag.filter(:user_id => user_id, :table_id => id).delete
    User.filter(:id => user_id).update(:tables_count => :tables_count - 1)
    owner.in_database(:as => :superuser) do |user_database|
      user_database.drop_table(name.to_sym)
      user_database.run("DROP SEQUENCE IF EXISTS #{self.name}_cartodb_id_seq")
    end
  end
  ## End of Callbacks

  def name=(new_name)
    new_name = set_table_name if new_name.blank?
    new_name = new_name.sanitize
    if !new? && !new_name.blank? && !name.blank? && new_name != name
      owner.in_database do |user_database|
        user_database.rename_table name, new_name
        user_database.run("ALTER SEQUENCE #{name}_cartodb_id_seq RENAME TO #{new_name}_cartodb_id_seq")
        begin
          user_database.run("ALTER INDEX #{name}_the_geom_idx RENAME TO #{new_name}_the_geom_idx")
          user_database.run("ALTER INDEX #{name}_#{THE_GEOM_WEBMERCATOR}_idx RENAME TO #{new_name}_#{THE_GEOM_WEBMERCATOR}_idx")
        rescue
        end
      end
    end
    $tables_metadata.rename key, key(new_name) if !new?
    self[:name] = new_name unless new_name.blank?
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
      $tables_metadata.hset key, "privacy", PRIVATE unless new?
      if !new?
        owner.in_database do |user_database|
          user_database.run("REVOKE SELECT ON #{self.name} FROM #{CartoDB::PUBLIC_DB_USER};")
        end
      end
    elsif value == "PUBLIC" || value == PUBLIC || value == PUBLIC.to_s
      self[:privacy] = PUBLIC
      $tables_metadata.hset key, "privacy", PUBLIC unless new?
      if !new?
        owner.in_database do |user_database|
          user_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
        end
      end
    end
  end

  def pending_to_save?
    self.name =~ /^untitle_table/
  end
  
  def key(new_name = nil)
    'rails:' + database_name + ':' + (new_name || name)
  end

  # TODO: use the database field
  def rows_counted
    owner.in_database do |user_database|
      user_database[name.to_sym].count
    end
  end

  def insert_row!(raw_attributes)
    primary_key = nil
    modified_schema = false
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      begin
        primary_key = user_database[name.to_sym].insert(attributes.except(:the_geom).convert_nulls)
      rescue Sequel::DatabaseError => e
        # If the type don't match the schema of the table is modified for the next valid type
        message = e.message.split("\n")[0]
        invalid_value = message.match(/"([^"]+)"$/)[1]
        invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
        if new_column_type = get_new_column_type(invalid_column, invalid_value)
          modified_schema = true
          user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
          update_stored_schema!
          retry
        else
          raise e
        end
      end
    end
    update_the_geom!(raw_attributes, primary_key) 
    if modified_schema
      update_stored_schema!
    end
    return primary_key
  end

  def update_row!(row_id, raw_attributes)
    rows_updated = 0
    modified_schema = false
    owner.in_database do |user_database|
      schema = user_database.schema(name.to_sym, :reload => true).map{|c| c.first}
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      if !attributes.except(:the_geom).empty?
        begin
          rows_updated = user_database[name.to_sym].filter(:cartodb_id => row_id).update(attributes.except(:the_geom).convert_nulls)
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          message = e.message.split("\n")[0]
          invalid_value = message.match(/"([^"]+)"$/)[1]
          invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
          if new_column_type = get_new_column_type(invalid_column, invalid_value)
            modified_schema = true
            user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
            retry
          else
            raise e
          end
        end
      else
        if attributes.size == 1 && attributes.keys == [:the_geom]
          rows_updated = 1
        end
      end
    end
    update_the_geom!(raw_attributes, row_id)
    if modified_schema
      update_stored_schema!
    end
    rows_updated
  end

  def schema(options = {})
    stored_schema = $tables_metadata.hget(key,"schema")
    return [] if stored_schema.blank?
    stored_schema = JSON.parse(stored_schema)
    return [] if stored_schema.blank?
    stored_schema.map do |column|
      c = column.split(',')
      [c[0].to_sym, c[options[:cartodb_types] == false ? 1 : 2], c[0].to_sym == :the_geom ? "geometry" : nil, c[0].to_sym == :the_geom ? the_geom_type : nil].compact
    end
  end

  def add_column!(options)
    type = options[:type].convert_to_db_type
    cartodb_type = options[:type].convert_to_cartodb_type
    owner.in_database do |user_database|
      user_database.add_column name.to_sym, options[:name].to_s.sanitize, type
    end
    update_stored_schema!
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
    owner.in_database do |user_database|
      user_database.drop_column name.to_sym, options[:name].to_s
    end
    update_stored_schema!
  end

  def modify_column!(options)
    new_name = options[:name] || options[:old_name]
    new_type = options[:type] ? options[:type].try(:convert_to_db_type) : schema(:cartodb_types => false).select{ |c| c[0] == new_name.to_sym }.first[1]
    cartodb_type = new_type.try(:convert_to_cartodb_type)
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        raise CartoDB::InvalidColumnName if options[:new_name] =~ /^[^a-zA-Z]+$/
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
    update_stored_schema!
    return {:name => new_name, :type => new_type, :cartodb_type => cartodb_type}
  end

  def records(options = {})
    rows  = []
    limit = (options[:rows_per_page] || 10).to_i
    limit = 5000 if limit > 5000
    # Allow to set the page number as a range between two pages
    if options[:page] && options[:page].is_a?(String) && options[:page].include?('..')
      first_page, last_page = options[:page].split('..')
      page = first_page.to_i*limit
      limit = (last_page.to_i - first_page.to_i + 1) *limit
    else
      page = (options[:page] || 0).to_i*limit
    end
    owner.in_database do |user_database|
      select = if schema.flatten.include?(:the_geom)
        schema.map{ |c| c[0] == :the_geom ? "ST_AsGeoJSON(the_geom,6) as the_geom" : c[0]}.join(',')
      else
        schema.map{|c| c[0] }.join(',')
      end
      rows = user_database["SELECT #{select} FROM #{name} LIMIT #{limit} OFFSET #{page}"].all
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
      select = if schema.flatten.include?(:the_geom)
        schema.select{|c| c[0] != :the_geom }.map{|c| c[0] }.join(',') + ",ST_AsGeoJSON(the_geom,6) as the_geom"
      else
        schema.map{|c| c[0] }.join(',')
      end
      row = user_database["SELECT #{select} FROM #{name} WHERE cartodb_id = #{identifier}"].first
    end
    raise if row.nil?
    row
  end

  def run_query(query)
    owner.run_query(query)
  end

  def constraints
    owner.in_database do |user_database|
      table_constraints_sql = <<-SQL
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = ? AND constraint_name = ?
      SQL
      user_database.fetch(table_constraints_sql, name, 'enforce_srid_the_geom').all
    end
  end

  def update_stored_schema(user_database)
    temporal_schema = user_database.schema(self.name.to_sym, :reload => true).map do |column|
      unless SKIP_SCHEMA_COLUMNS.include?(column.first.to_sym)
        col = "#{column.first},#{column[1][:db_type].gsub(/,\d+/,"")},#{column[1][:db_type].convert_to_cartodb_type}"
        if column.first.to_sym == :the_geom
          col += ",#{the_geom_type}"
        end
        col
      end
    end.compact
    stored_schema = ["cartodb_id,integer,#{"integer".convert_to_cartodb_type}"] +
      temporal_schema +
      ["created_at,timestamp,#{"timestamp".convert_to_cartodb_type}", "updated_at,timestamp,#{"timestamp".convert_to_cartodb_type}"]
    $tables_metadata.hset(key,"columns", stored_schema.map{|c| c.split(',').first }.to_json)
    $tables_metadata.hset(key,"schema", stored_schema)
  end

  def update_stored_schema!
    owner.in_database do |user_database|
      update_stored_schema(user_database)
    end
  end
  
  def georeference_from!(options = {})
    if !options[:latitude_column].blank? && !options[:longitude_column].blank?
      set_the_geom_column!("point")
      owner.in_database do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = ST_GeomFromText('POINT(' || #{options[:longitude_column]} || ' ' || #{options[:latitude_column]} || ')',#{CartoDB::SRID})")
        user_database.run("ALTER TABLE #{self.name} DROP COLUMN #{options[:longitude_column]}")
        user_database.run("ALTER TABLE #{self.name} DROP COLUMN #{options[:latitude_column]}")
      end
      update_stored_schema!
    else
      raise InvalidArgument
    end
  end
  
  def set_trigger_the_geom_webmercator
    owner.in_database(:as => :superuser) do |user_database|
      user_database.run(<<-TRIGGER     
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

  def set_table_name
    base_name = "Untitle table".sanitize
    return base_name if user_id.nil?
    i = 1
    while Table.filter(:user_id => user_id, :name => base_name).count != 0
      i += 1
      base_name = "Untitle table #{i}".sanitize
    end
    base_name
  end

  def import_data_from_file!
    return if self.import_from_file.blank?

    path = if import_from_file.respond_to?(:tempfile)
      import_from_file.tempfile.path
    else
      import_from_file.path
    end

    db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
    host = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
    port = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
    @quote = (@quote == '"' || @quote.blank?) ? '\"' : @quote
    @quote = @quote == '`' ? '\`' : @quote
    command = "copy #{self.name} from STDIN WITH DELIMITER '#{@col_separator || ','}' CSV QUOTE AS '#{@quote}'"
    system %Q{awk 'NR>1{print $0}' #{path} | `which psql` #{host} #{port} -U#{db_configuration['username']} -w #{database_name} -c"#{command}"}
    owner.in_database do |user_database|      
      #Check if the file had data, if not rise an error because probably something went wrong
      if user_database["SELECT * from #{self.name} LIMIT 1"].first.blank? 
        raise "The file was empty or there was a problem importing it that made it create an empty table"
      end
      
      user_database.run("alter table #{self.name} add column cartodb_id integer")
      user_database.run("create sequence #{self.name}_cartodb_id_seq")
      user_database.run("update #{self.name} set cartodb_id = nextval('#{self.name}_cartodb_id_seq')")
      user_database.run("alter table #{self.name} alter column cartodb_id set default nextval('#{self.name}_cartodb_id_seq')")
      user_database.run("alter table #{self.name} alter column cartodb_id set not null")
      user_database.run("alter table #{self.name} add unique (cartodb_id)")
      user_database.run("alter table #{self.name} drop constraint #{self.name}_cartodb_id_key restrict")
      user_database.run("alter table #{self.name} add primary key (cartodb_id)")
      user_database.run("alter table #{self.name} add column created_at timestamp DEFAULT now()")
      user_database.run("alter table #{self.name} add column updated_at timestamp DEFAULT now()")
      set_the_geom_column!("point")
    end
  end

  def guess_schema
    @col_separator = ','
    options = {:col_sep => @col_separator}
    schemas = []
    uk_column_counter = 0

    path = if import_from_file.respond_to?(:tempfile)
      import_from_file.tempfile.path
    else
      import_from_file.path
    end

    csv = CSV.open(path, options)
    column_names = csv.gets

    if column_names.size == 1
      candidate_col_separators = {}
      column_names.first.scan(/([^\w\s])/i).flatten.uniq.each do |candidate|
        candidate_col_separators[candidate] = 0
      end
      candidate_col_separators.keys.each do |candidate|
        csv = CSV.open(path, options.merge(:col_sep => candidate))
        column_names = csv.gets
        candidate_col_separators[candidate] = column_names.size
      end
      @col_separator = candidate_col_separators.sort{|a,b| a[1]<=>b[1]}.last.first
      csv = CSV.open(path, options.merge(:col_sep => @col_separator))
      column_names = csv.gets
    end

    column_names = column_names.map do |c|
      results = c.scan(/^(["`\'])[^"`\']+(["`\'])$/).flatten
      if results.size == 2 && results[0] == results[1]
        @quote = $1
      end
      if c.blank?
        uk_column_counter += 1
        "unknow_name_#{uk_column_counter}"
      else
        c.sanitize
      end
    end

    while (line = csv.gets)
      line.each_with_index do |field, i|
        next if line[i].blank?
        unless @quote
          results = line[i].scan(/^(["`\'])[^"`\']+(["`\'])$/).flatten
          if results.size == 2 && results[0] == results[1]
            @quote = $1
          end
        end
        if schemas[i].nil?
          if line[i] =~ /^\-?[0-9]+[\.|\,][0-9]+$/
            schemas[i] = "float"
          elsif line[i] =~ /^[0-9]+$/
            schemas[i] = "integer"
          else
            schemas[i] = "varchar"
          end
        else
          case schemas[i]
          when "integer"
            if line[i] !~ /^[0-9]+$/
              if line[i] =~ /^\-?[0-9]+[\.|\,][0-9]+$/
                schemas[i] = "float"
              else
                schemas[i] = "varchar"
              end
            end
          end
        end
      end
    end

    result = []
    column_names.each_with_index do |column_name, i|
      result << "#{column_name} #{schemas[i] || "varchar"}"
    end

    self.force_schema = result.join(', ')
  end

  def delete_constraints
    owner.in_database do |user_database|
      user_database.alter_table(self.name.to_sym) do
        drop_constraint(:enforce_srid_the_geom)
      end
    end
  end

  def set_trigger_update_updated_at
    owner.in_database(:as => :superuser) do |user_database|
      user_database.run(<<-TRIGGER
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
  end

  def get_new_column_type(invalid_column, invalid_value)
    flatten_cartodb_schema = schema.flatten
    cartodb_column_type = flatten_cartodb_schema[flatten_cartodb_schema.index(invalid_column.to_sym) + 1]
    flatten_schema = schema(:cartodb_types => false).flatten
    column_type = flatten_schema[flatten_schema.index(invalid_column.to_sym) + 1]
    if cartodb_column_type == "number" && invalid_value =~ /^\-?[0-9]+[\.|\,][0-9]+$/
      i = CartoDB::TYPES[cartodb_column_type].index(column_type) + 1
      t = CartoDB::TYPES[cartodb_column_type][i]
      while !t.is_a?(String)
        i+=1
        t = CartoDB::TYPES[cartodb_column_type][i]
      end
      t
    else
      nil
    end
  end

  def set_the_geom_column!(type)
    raise InvalidArgument unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)
    type = type.to_s.upcase
    updates = false
    owner.in_database do |user_database|
      return if !force_schema.blank? && !user_database.schema(name.to_sym, :reload => true).flatten.include?(:the_geom)
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(:the_geom)
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','the_geom',#{CartoDB::SRID},'#{type}',2)")
        user_database.run("CREATE INDEX #{self.name}_the_geom_idx ON #{self.name} USING GIST(the_geom)")
        updates = true
      end
      unless user_database.schema(name.to_sym, :reload => true).flatten.include?(THE_GEOM_WEBMERCATOR)
        user_database.run("SELECT AddGeometryColumn ('#{self.name}','#{THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{type}',2)")
        user_database.run("CREATE INDEX #{self.name}_#{THE_GEOM_WEBMERCATOR}_idx ON #{self.name} USING GIST(#{THE_GEOM_WEBMERCATOR})")        
        updates = true
      end
      update_stored_schema(user_database) if updates
    end
    self.the_geom_type = type.downcase
    save_changes
    if updates
      set_trigger_the_geom_webmercator
    end
  end

  def set_table_schema!
    owner.in_database do |user_database|
      if imported_table_name.blank?
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
            if column =~ /^\s*\"([^\"]+)\"(.*)$/
              "#{$1.sanitize} #{$2.gsub(/primary\s+key/i,"UNIQUE")}"
            else
              column.gsub(/primary\s+key/i,"UNIQUE")
            end
          end
          # If import_from_file is blank primary key is added now.
          # If not we add it after importing the CSV file, becaus the number of columns
          # will not match
          if import_from_file.blank?
            sanitized_force_schema.unshift("cartodb_id SERIAL PRIMARY KEY")
            sanitized_force_schema.unshift("created_at timestamp")
            sanitized_force_schema.unshift("updated_at timestamp")
          end
          user_database.run("CREATE TABLE #{self.name} (#{sanitized_force_schema.join(', ')})")
          if import_from_file.blank?
            user_database.run("alter table #{self.name} alter column created_at SET DEFAULT now()")
            user_database.run("alter table #{self.name} alter column updated_at SET DEFAULT now()")
          end
        end
      else
        pk = user_database.schema(self.name).select{ |c| c[1][:primary_key] == true }
        if pk.size > 0
          pk = pk.first[0] if pk.size > 1
          user_database.rename_column name.to_sym, pk, :cartodb_id
        else
          user_database.run("alter table #{self.name} add column cartodb_id integer")
          user_database.run("create sequence #{self.name}_cartodb_id_seq")
          user_database.run("update #{self.name} set cartodb_id = nextval('#{self.name}_cartodb_id_seq')")
          user_database.run("alter table #{self.name} alter column cartodb_id set default nextval('#{self.name}_cartodb_id_seq')")
          user_database.run("alter table #{self.name} alter column cartodb_id set not null")
          user_database.run("alter table #{self.name} add unique (cartodb_id)")
          user_database.run("alter table #{self.name} drop constraint #{self.name}_cartodb_id_key restrict")
          user_database.run("alter table #{self.name} add primary key (cartodb_id)")
        end
        user_database.run("alter table #{self.name} add column created_at timestamp DEFAULT now()")
        user_database.run("alter table #{self.name} add column updated_at timestamp DEFAULT now()")
      end
    end
  end

  # FIXME: handle exceptions and don't create tables
  def handle_import_file!
    if import_from_file.is_a?(String)
      open(import_from_file) do |res|
        file_name = File.basename(import_from_file)
        ext = File.extname(file_name)
        self.import_from_file = File.new("#{Rails.root}/tmp/uploading_#{user_id}.#{ext}", 'w+')
        self.import_from_file.write(res.read.force_encoding('utf-8'))
        self.import_from_file.close
      end
    end

    original_filename = if import_from_file.respond_to?(:original_filename)
      import_from_file.original_filename
    else
      import_from_file.path
    end
    ext = File.extname(original_filename)
    path = if import_from_file.respond_to?(:tempfile)
      import_from_file.tempfile.path
    else
      import_from_file.path
    end
    
    # If it is a zip file we should find a shp file
    entries = []
    if ext == '.zip'
      Rails.logger.info "Importing zip file: #{path}"
      Zip::ZipFile.foreach(path) do |entry|
        name = entry.name.split('/').last
        next if name =~ /^(\.|\_{2})/
        entries << "/tmp/#{name}"
        if File.extname(name) == '.shp'
          ext = '.shp'
          path = "/tmp/#{name}"
          original_filename = name
          Rails.logger.info "Found original shapefile #{name} in path #{path}"
        end
        if File.file?("/tmp/#{name}")
          FileUtils.rm("/tmp/#{name}")
        end
        entry.extract("/tmp/#{name}")
      end
    end
    if ext == '.csv'
      self.name ||= File.basename(original_filename,ext).tr('.','_').downcase.sanitize
    end
    return unless %W{ .ods .xls .xlsx .shp }.include?(ext)

    if ext == '.shp'
      raise CartoDB::InvalidSRID if self.importing_SRID.blank?
      self.importing_encoding ||= 'LATIN1'
      db_configuration = ::Rails::Sequel.configuration.environment_for(Rails.env)
      host = db_configuration['host'] ? "-h #{db_configuration['host']}" : ""
      port = db_configuration['port'] ? "-p #{db_configuration['port']}" : ""
      self.imported_table_name = File.basename(path).tr('.','_').downcase.sanitize
      self.name = self.imported_table_name.dup if self.name.blank?
      random_name = "importing_table_#{self.name}"
      Rails.logger.info "Table name to import: #{random_name}"
      Rails.logger.info "Running shp2pgsql: `which shp2pgsql` -W#{importing_encoding} -s #{self.importing_SRID} #{path} #{random_name} | `which psql` #{host} #{port} -U#{owner.database_username} -w #{database_name}"
      system("`which shp2pgsql` -W#{importing_encoding} -s #{self.importing_SRID} #{path} #{random_name} | `which psql` #{host} #{port} -U#{owner.database_username} -w #{database_name}")
      owner.in_database do |user_database|
        imported_schema = user_database[random_name.to_sym].columns
        user_database.run("CREATE TABLE #{self.name} AS SELECT #{(imported_schema - [:the_geom]).join(',')},the_geom,ST_TRANSFORM(the_geom,#{CartoDB::GOOGLE_SRID}) as #{THE_GEOM_WEBMERCATOR} FROM #{random_name}")
        user_database.run("DROP TABLE #{random_name}")
        user_database.run("CREATE INDEX #{self.name}_the_geom_idx ON #{self.name} USING GIST(the_geom)")
        geometry_type = user_database["select GeometryType(the_geom) FROM #{self.name} limit 1"].first[:geometrytype]
        user_database.run("CREATE INDEX #{self.name}_#{THE_GEOM_WEBMERCATOR}_idx ON #{self.name} USING GIST(#{THE_GEOM_WEBMERCATOR})")
        user_database.run("VACUUM ANALYZE #{self.name}")
        self.set_trigger_the_geom_webmercator
        self.the_geom_type = geometry_type.downcase
      end
      if entries.any?
        entries.each{ |e| FileUtils.rm_rf(e) }
      end
      return
    else
      csv_name = File.basename(original_filename, ext)
      new_path = "/tmp/#{csv_name}#{ext}"
      fd = File.open(new_path,'w')
      fd.write(import_from_file.read.force_encoding('utf-8'))
      fd.close
      s = case ext
      when '.xls'
        Excel.new(new_path)
      when '.xlsx'
        Excelx.new(new_path)
      when '.ods'
        Openoffice.new(new_path)
      else
        raise ArgumentError, "Don't know how to open file #{file}"
      end
      s.to_csv("/tmp/#{csv_name}.csv")
      self.import_from_file = File.open("/tmp/#{csv_name}.csv",'r')
    end
  end
  
  def update_the_geom!(attributes, primary_key)
    return unless attributes[:the_geom]
    geo_json = RGeo::GeoJSON.decode(attributes[:the_geom], :json_parser => :json).try(:as_text)
    raise CartoDB::InvalidGeoJSONFormat if geo_json.nil?
    owner.in_database do |user_database|
      user_database.run("UPDATE #{self.name} SET the_geom = ST_GeomFromText('#{geo_json}',#{CartoDB::SRID}) where cartodb_id = #{primary_key}")
    end
  end

end
