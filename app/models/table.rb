# coding: UTF-8

class CartoDB::InvalidType < StandardError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
    @db_message = message.split("\n")[0]
    @syntax_message = message.split("\n")[1..-1].join("\n")
  end
end

class CartoDB::EmtpyAttributes < StandardError
  attr_accessor :error_message
  def initialize(message)
    @error_message = message
  end
end

class CartoDB::InvalidAttributes < StandardError
  attr_accessor :error_message
  def initialize(message)
    @error_message = message
  end
end

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:name, :privacy, :tags)

  attr_accessor :force_schema, :import_from_file, :import_from_external_url

  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }

  ## Callbacks
  def validate
    super
    errors.add(:user_id, 'can\'t be blank') if user_id.blank?
    errors.add(:name,    'can\'t be blank') if name.blank?
    errors.add(:privacy, 'has an invalid value') if privacy != PRIVATE && privacy != PUBLIC
    validates_unique [:name, :user_id], :message => 'is already taken'
  end

  def before_validation
    self.privacy ||= PUBLIC
    self.name = set_table_name if self.name.blank?
    super
  end

  # Before creating a user table a table should be created in the database.
  # This table has an empty schema
  def before_create
    update_updated_at
    unless import_from_external_url.blank?
      import_data_from_external_url!
    end
    guess_schema if force_schema.blank? && !import_from_file.blank?
    unless self.user_id.blank? || self.name.blank?
      owner.in_database do |user_database|
        if !user_database.table_exists?(self.name.to_sym)
          if force_schema.blank?
            user_database.create_table self.name.to_sym do
              column :cartodb_id, "SERIAL PRIMARY KEY"
              String :name
              Float :latitude
              Float :longitude
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
        end
      end
      unless import_from_file.blank?
        import_data_from_file!
      end
      set_triggers
    end
    super
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
    set_lat_lon_columns!(:latitude, :longitude) if schema.flatten.include?(:latitude) && schema.flatten.include?(:longitude)
    unless private?
      owner.in_database do |user_database|
        user_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      end
    end
  end

  def after_destroy
    super
    Tag.filter(:user_id => user_id, :table_id => id).delete
    User.filter(:id => user_id).update(:tables_count => :tables_count - 1)
    owner.in_database{|user_database| user_database.drop_table(name.to_sym)}
  end
  ## End of Callbacks

  def name=(new_name)
    new_name = set_table_name if new_name.blank?
    new_name = new_name.sanitize
    if !new? && !new_name.blank? && !name.blank? && new_name != name
      owner.in_database do |user_database|
        user_database.rename_table name, new_name
      end
    end
    self[:name] = new_name unless new_name.blank?
  end

  def tags=(value)
    self[:tags] = value.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
  end

  def private?
    privacy == PRIVATE
  end
  
  def privacy=(value)
    value == "PRIVATE" ? 0 : 1
  end

  def public?
    !private?
  end

  def toggle_privacy!
    if private?
      set(:privacy => PUBLIC)
      save_changes
      owner.in_database do |user_database|
        user_database.run("GRANT SELECT ON #{self.name} TO #{CartoDB::PUBLIC_DB_USER};")
      end
    else
      set(:privacy => PRIVATE)
      save_changes
      owner.in_database do |user_database|
        user_database.run("REVOKE SELECT ON #{self.name} FROM #{CartoDB::PUBLIC_DB_USER};")
      end
    end
  end

  def pending_to_save?
    self.name =~ /^untitle_table/
  end

  # TODO: use the database field
  def rows_counted
    owner.in_database do |user_database|
      user_database[name.to_sym].count
    end
  end

  def insert_row!(raw_attributes)
    primary_key = nil
    owner.in_database do |user_database|
      attributes = raw_attributes.dup.select{ |k,v| user_database.schema(name.to_sym).map{|c| c.first}.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      begin
        primary_key = user_database[name.to_sym].insert(attributes)
      rescue Sequel::DatabaseError => e
        # If the type don't match the schema of the table is modified for the next valid type
        message = e.message.split("\n")[0]
        invalid_value = message.match(/"([^"]+)"$/)[1]
        invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
        if new_column_type = get_new_column_type(invalid_column, invalid_value)
          user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
          retry
        else
          raise e
        end
      end
      geocode!(attributes)
    end
    return primary_key
  end

  def update_row!(row_id, raw_attributes)
    rows_updated = 0
    owner.in_database do |user_database|
      attributes = raw_attributes.dup.select{ |k,v| user_database.schema(name.to_sym).map{|c| c.first}.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      unless attributes.empty?
        begin
          rows_updated = user_database[name.to_sym].filter(:cartodb_id => row_id).update(attributes)
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          message = e.message.split("\n")[0]
          invalid_value = message.match(/"([^"]+)"$/)[1]
          invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
          if new_column_type = get_new_column_type(invalid_column, invalid_value)
            user_database.set_column_type self.name.to_sym, invalid_column.to_sym, new_column_type
            retry
          else
            raise e
          end
        end
        geocode!(attributes)
      end
    end
    rows_updated
  end

  def self.schema(user, table, options = {})
    options[:cartodb_types] ||= false
    temporal_schema = user.in_database do |user_database|
      user_database.schema(table.name.to_sym).map do |column|
        [
          column.first,
          (options[:cartodb_types] == true ? column[1][:db_type].convert_to_cartodb_type : column[1][:db_type])
        ] unless CARTODB_COLUMNS.include?(column.first.to_s)
      end.compact
    end
    schema = [[:cartodb_id, (options[:cartodb_types] == true ? "integer".convert_to_cartodb_type :  "integer")]] +
      temporal_schema +
      [[:created_at, (options[:cartodb_types] == true ? "timestamp".convert_to_cartodb_type :  "timestamp")]] +
      [[:updated_at, (options[:cartodb_types] == true ? "timestamp".convert_to_cartodb_type :  "timestamp")]]
    unless table.geometry_columns.blank?
      schema.each do |col|
        col << "latitude"  if col[0].to_sym == table.lat_column
        col << "longitude" if col[0].to_sym == table.lon_column
        col << "address"   if col[0].to_sym == table.address_column
      end
    end
    return schema
  end

  def schema(options = {})
    self.class.schema(owner, self, options)
  end

  def add_column!(options)
    type = options[:type].convert_to_db_type
    cartodb_type = options[:type].convert_to_cartodb_type
    owner.in_database do |user_database|
      user_database.add_column name.to_sym, options[:name].to_s.sanitize, type
    end
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
    if options[:name].to_sym == address_column || options[:name].to_sym == lat_column || options[:name].to_sym == lon_column
      self.geometry_columns = nil
      save_changes
    end
    owner.in_database do |user_database|
      user_database.drop_column name.to_sym, options[:name].to_s
    end
  end

  def modify_column!(options)
    new_name = options[:name] || options[:old_name]
    new_type = options[:type] ? options[:type].try(:convert_to_db_type) : schema.select{ |c| c[0] == new_name.to_sym }.first.last
    cartodb_type = new_type.try(:convert_to_cartodb_type)
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        raise if CARTODB_COLUMNS.include?(options[:old_name].to_s)
        user_database.rename_column name.to_sym, options[:old_name].to_sym, options[:new_name].sanitize.to_sym
        new_name = options[:new_name].sanitize
        if options[:old_name].to_sym == address_column
          self.geometry_columns = new_name
          save_changes
        elsif options[:old_name].to_sym == lat_column
          self.geometry_columns = "#{new_name}|#{lon_column}"
          save_changes
        elsif options[:old_name].to_sym == lon_column
          self.geometry_columns = "#{lat_column}|#{new_name}"
          save_changes
        end
      end
      if options[:type]
        column_name = (options[:new_name] || options[:name]).sanitize
        raise if CARTODB_COLUMNS.include?(column_name)
        if column_name.to_sym == address_column && cartodb_type && cartodb_type != "string"
          self.geometry_columns = nil
          save_changes
        end
        if (column_name.to_sym == lat_column || column_name.to_sym == lon_column) && cartodb_type && cartodb_type != "number"
          self.geometry_columns = nil
          save_changes
        end
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
    limit = (options[:rows_per_page] || 10).to_i
    limit = 5000 if limit > 5000
    if options[:page] && options[:page].is_a?(String) && options[:page].include?('..')
      first_page, last_page = options[:page].split('..')
      page = first_page.to_i*limit
      limit = (last_page.to_i - first_page.to_i + 1) *limit
    else
      page = (options[:page] || 0).to_i*limit
    end
    owner.in_database do |user_database|
      rows = user_database[name.to_sym].limit(limit,page).
              order(:cartodb_id).
              select(*schema.map{ |e| e[0]}).
              all.map do |row|
                row.each do |k,v|
                  if v.is_a?(Date) || v.is_a?(Time)
                    row[k] = v.strftime("%Y-%m-%d %H:%M:%S")
                  end
                end
                row
             end
    end
    {
      :id         => id,
      :name       => name,
      :total_rows => rows_counted,
      :rows       => rows
    }
  end

  def record(identifier)
    owner.in_database do |user_database|
      row = user_database[name.to_sym].
        select(*schema.map{ |e| e[0]}).
        where(:cartodb_id => identifier).
        first
      raise if row.empty?
      row.each do |k,v|
        if v.is_a?(Date) || v.is_a?(Time)
          row[k] = v.strftime("%Y-%m-%d %H:%M:%S")
        end
      end
      row
    end
  end

  def set_lat_lon_columns!(lat_column, lon_column)
    self.geometry_columns = nil
    set_the_geom_column!(:point)
    if lat_column && lon_column
      owner.in_database do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = ST_Transform(ST_SetSRID(ST_Makepoint(#{lon_column},#{lat_column}),#{CartoDB::SRID}),#{CartoDB::GOOGLE_SRID})")
      end
      self.geometry_columns = "#{lat_column}|#{lon_column}"
    end
    save_changes
  end

  def lat_column
    if !geometry_columns.blank? && geometry_columns.include?('|')
      geometry_columns.split('|')[0].to_sym
    else
      nil
    end
  end

  def lon_column
    if !geometry_columns.blank? && geometry_columns.include?('|')
      geometry_columns.split('|')[1].to_sym
    else
      nil
    end
  end

  def set_address_column!(address_column)
    set_the_geom_column!(:point)
    if address_column.include?(',')
      aggregated_address_name = "aggregated_address"
      owner.in_database do |user_database|
        user_database.run("alter table #{self.name} add column #{aggregated_address_name} varchar")
        user_database.run("update #{self.name} set #{aggregated_address_name}=#{address_column.split(',').map{ |c| c.strip }.join('||\',\'||')}")
      end
      address_column = aggregated_address_name
    end
    self.geometry_columns = address_column.try(:to_s)
    save_changes
    geocode_all_address_columns! if rows_counted > 0
  end

  def address_column
    unless geometry_columns.blank? || geometry_columns.include?('|')
      geometry_columns.try(:to_sym)
    else
      nil
    end
  end

  def update_geometry!(row_id, attributes)
    if address_column
      if attributes[:address]
        update_row!(row_id, {address_column => attributes[:address]})
      end
      owner.in_database do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = ST_Transform(ST_SetSRID(ST_Makepoint(#{attributes[:lon]},#{ attributes[:lat]}),#{CartoDB::SRID}),#{CartoDB::GOOGLE_SRID}) where cartodb_id = #{row_id}")
      end
    else
      update_row!(row_id, {lat_column => attributes[:lat], lon_column => attributes[:lon]})
    end
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

  private

  def update_updated_at
    self.updated_at = Time.now
  end

  def update_updated_at!
    update_updated_at && save_changes
  end

  def owner
    @owner ||= User.select(:id,:database_name,:crypted_password).filter(:id => self.user_id).first
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

  def import_data_from_external_url!
    return if self.import_from_external_url.blank?
    url = URI.parse(self.import_from_external_url)
    req = Net::HTTP::Get.new(url.path)
    res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
    json = JSON.parse(res.body)
    columns = []
    filepath = "#{Rails.root}/tmp/importing_#{user_id}.csv"
    if json.is_a?(Array)
      raise "Invalid JSON format" unless json.first.is_a?(Hash)
      CSV.open(filepath, "wb") do |csv|
        csv << json.first.keys
        json.each do |row|
          csv << row.values
        end
      end
    elsif json.is_a?(Hash)
      CSV.open(filepath, "wb") do |csv|
        csv << json.keys
        csv << json.values
      end
    else
      raise "Invalid JSON format"
    end
    self.import_from_file = File.open(filepath,'r')
  end

  def import_data_from_file!
    return if self.import_from_file.blank?
    path = if import_from_file.respond_to?(:tempfile)
      import_from_file.tempfile.path
    else
      import_from_file.path
    end
    filename = "#{Rails.root}/tmp/importing_csv_#{self.user_id}.csv"
    system("awk 'NR>1{print $0}' #{path} > #{filename}")
    owner.in_database(:as => :superuser) do |user_database|
      user_database.run("copy #{self.name} from '#{filename}' WITH DELIMITER '#{@col_separator || ','}' CSV QUOTE AS '#{@quote || '"'}'")
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
    end
  ensure
    FileUtils.rm filename
    # FileUtils.rm path
  end

  def guess_schema
    return if self.import_from_file.nil?
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
          if line[i] =~ /^[0-9]+$/
            schemas[i] = "integer"
          elsif line[i] =~ /^\-?[0-9]+[\.|\,][0-9]+$/
            schemas[i] = "float"
          else
            schemas[i] = "varchar"
          end
        else
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

  def set_triggers
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

  def geocode_all_address_columns!
    # owner.in_database do |user_database|
    #   result = owner.run_query("select cartodb_id, #{address_column} as address_column FROM #{self.name} order by cartodb_id")
    #   result[:rows].each do |row|
    #     next if row[:address_column].blank?
    #     url = URI.parse("http://maps.google.com/maps/api/geocode/json?address=#{CGI.escape(row[:address_column])}&sensor=false")
    #     req = Net::HTTP::Get.new(url.request_uri)
    #     res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
    #     json = JSON.parse(res.body)
    #     if json['status'] == 'OK' && !json['results'][0]['geometry']['location']['lng'].blank? && !json['results'][0]['geometry']['location']['lat'].blank?
    #       user_database.run("UPDATE #{self.name} SET the_geom = ST_Transform(ST_SetSrID(PointFromText('POINT(' || #{json['results'][0]['geometry']['location']['lng']} || ' ' || #{json['results'][0]['geometry']['location']['lat']} || ')'),#{CartoDB::SRID}),#{CartoDB::GOOGLE_SRID}) where cartodb_id = #{row[:cartodb_id]}")
    #     end
    #   end
    # end
  end

  def get_new_column_type(invalid_column, invalid_value)
    flatten_cartodb_schema = schema(:cartodb_types => true).flatten
    cartodb_column_type = flatten_cartodb_schema[flatten_cartodb_schema.index(invalid_column.to_sym) + 1]
    flatten_schema = schema.flatten
    column_type = flatten_schema[flatten_schema.index(invalid_column.to_sym) + 1]
    new_column_type = if cartodb_column_type == "number" && invalid_value =~ /^\-?[0-9]+[\.|\,][0-9]+$/
      CartoDB::TYPES[cartodb_column_type][CartoDB::TYPES.keys.index(cartodb_column_type) + 1]
    else
      nil
    end
  end

  def geocode!(attributes)
    # if !address_column.blank? && attributes.keys.include?(address_column) && !attributes[address_column].blank?
    #   url = URI.parse("http://maps.google.com/maps/api/geocode/json?address=#{CGI.escape(attributes[address_column])}&sensor=false")
    #   req = Net::HTTP::Get.new(url.request_uri)
    #   res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
    #   json = JSON.parse(res.body)
    #   if json['status'] == 'OK' && !json['results'][0]['geometry']['location']['lng'].blank? && !json['results'][0]['geometry']['location']['lat'].blank?
    #     owner.in_database do |user_database|
    #       user_database.run("UPDATE #{self.name} SET the_geom = ST_Transform(ST_SetSrID(PointFromText('POINT(' || #{json['results'][0]['geometry']['location']['lng']} || ' ' || #{json['results'][0]['geometry']['location']['lat']} || ')'),#{CartoDB::SRID}),#{CartoDB::GOOGLE_SRID})")
    #     end
    #   end
    # end
    if !lat_column.blank? && !lon_column.blank?
      owner.in_database do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = ST_Transform(ST_SetSRID(ST_Makepoint(#{lon_column},#{lat_column}),#{CartoDB::SRID}),#{CartoDB::GOOGLE_SRID})")
      end
    end
  end

  def set_the_geom_column!(type)
    owner.in_database do |user_database|
      unless user_database.schema(name.to_sym).flatten.include?(:the_geom)
        if type == :point
          user_database.run("SELECT AddGeometryColumn ('#{self.name}','the_geom',#{CartoDB::GOOGLE_SRID},'POINT',2)")
        end
      end
    end
  end

end
