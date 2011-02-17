# coding: UTF-8

class CartoDB::InvalidType < StandardError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
    @db_message = message.split("\n")[0]
    @syntax_message = message.split("\n")[1..-1].join("\n")
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
    errors.add(:user_id, 'can\'t be blank')  if user_id.blank?
    errors.add(:name,    'can\'t be blank')  if name.blank?
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
              primary_key :cartodb_id
              String :name
              Float :latitude
              Float :longitude
              String :description, :text => true
              DateTime :created_at, :default => "now()"
              DateTime :updated_at, :default => "now()"
              column :the_geom, 'geometry'
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
              sanitized_force_schema.unshift("the_geom geometry")
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
    set_lan_lon_columns!(:latitude, :longitude) if schema.flatten.include?(:latitude) && schema.flatten.include?(:longitude)
  end

  def after_destroy
    super
    Tag.filter(:user_id => user_id, :table_id => id).delete
    User.filter(:id => user_id).update(:tables_count => :tables_count - 1)
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

  def public?
    !private?
  end

  def toggle_privacy!
    private? ? set(:privacy => PUBLIC) : set(:privacy => PRIVATE)
    save_changes
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

  def insert_row!(attributes)
    owner.in_database do |user_database|
      attributes = attributes.dup.select{ |k,v| user_database[name.to_sym].columns.include?(k.to_sym) }
      unless attributes.empty?
        user_database[name.to_sym].insert(attributes)
        unless address_column.blank?
          geocode_address_column!(attributes[address_column])
        end
      end
    end
  end

  def update_row!(row_id, attributes)
    owner.in_database do |user_database|
      attributes = attributes.dup.select{ |k,v| user_database[name.to_sym].columns.include?(k.to_sym) }
      unless attributes.empty?
        user_database[name.to_sym].filter(:cartodb_id => row_id).update(attributes)
        if !address_column.blank? && attributes.keys.include?(address_column)
          geocode_address_column!(attributes[address_column])
        end
      end
    end
    return true
  end

  def schema(options = {})
    options[:cartodb_types] ||= false
    temporal_schema = owner.in_database do |user_database|
      user_database.schema(name.to_sym).map do |column|
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
    unless geometry_columns.blank?
      schema.each do |col|
        col << "latitude"  if col[0].to_sym == lat_column
        col << "longitude" if col[0].to_sym == lon_column
        col << "address"   if col[0].to_sym == address_column
      end
    end
    return schema
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
    owner.in_database do |user_database|
      user_database.drop_column name.to_sym, options[:name].to_s
    end
  end

  def modify_column!(options)
    new_name = options[:name]
    new_type = options[:type].try(:convert_to_db_type)
    cartodb_type = options[:type].try(:convert_to_cartodb_type)
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        raise if CARTODB_COLUMNS.include?(options[:old_name].to_s)
        user_database.rename_column name.to_sym, options[:old_name].to_sym, options[:new_name].sanitize.to_sym
        new_name = options[:new_name].sanitize
      end
      if options[:type]
        column_name = (options[:new_name] || options[:name]).sanitize
        raise if CARTODB_COLUMNS.include?(column_name)
        begin
          user_database.set_column_type name.to_sym, column_name.to_sym, options[:type]
        rescue => e
          message = e.message.split("\n").first
          if message =~ /cannot be cast to type/
            user_database.transaction do
              random_name = "new_column_#{rand(10)*Time.now.to_i}"
              user_database.add_column name.to_sym, random_name, options[:type]
              user_database["UPDATE #{name} SET #{random_name}=#{column_name}::#{options[:type]}"]
              user_database.drop_column name.to_sym, column_name.to_sym
              user_database.rename_column name.to_sym, random_name, column_name.to_sym
            end
          end
        end
      end
    end
    return {:name => new_name, :type => new_type, :cartodb_type => cartodb_type}
  end

  def to_json(options = {})
    rows = []
    limit = (options[:rows_per_page] || 10).to_i
    offset = (options[:page] || 0).to_i*limit
    owner.in_database do |user_database|
      rows = user_database[name.to_sym].limit(limit,offset).
              order(:cartodb_id).select(*schema.map{ |e| e[0]}).all.map do |row|
                row[:created_at] = row[:created_at].strftime("%H:%M:%S %Y-%m-%d")
                row[:updated_at] = row[:updated_at].strftime("%H:%M:%S %Y-%m-%d")
                row
             end
    end
    {
      :total_rows => rows_counted,
      :columns => schema({:cartodb_types => options[:cartodb_types]}),
      :rows => rows
    }
  end

  def set_lan_lon_columns!(lat_column, lon_column)
    if lat_column && lon_column
      owner.in_database(:as => :superuser) do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = PointFromText('POINT(' || #{lon_column} || ' ' || #{lat_column} || ')',4236)")
        user_database.run(<<-TRIGGER
          -- Sets trigger to update the_geom automagically
          DROP TRIGGER IF EXISTS update_geometry_trigger ON #{self.name};

          CREATE OR REPLACE FUNCTION update_geometry() RETURNS TRIGGER AS $update_geometry_trigger$
            BEGIN
                 NEW.the_geom := PointFromText('POINT(' || NEW.#{lon_column} || ' ' || NEW.#{lat_column} || ')',4236);
                 RETURN NEW;
            END;
          $update_geometry_trigger$ LANGUAGE plpgsql;

          CREATE TRIGGER update_geometry_trigger
          BEFORE UPDATE ON #{self.name}
              FOR EACH ROW EXECUTE PROCEDURE update_geometry();

TRIGGER
        )
      end
      self.geometry_columns = "#{lat_column}|#{lon_column}"
    else
      owner.in_database(:as => :superuser) do |user_database|
        user_database.run(<<-TRIGGER
          -- Sets trigger to update the_geom automagically
          DROP TRIGGER IF EXISTS update_geometry_trigger ON #{self.name};
TRIGGER
        )
      end
      self.geometry_columns = nil
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
    self.geometry_columns = address_column.try(:to_s)
    save_changes
  end

  def address_column
    unless geometry_columns.blank? || geometry_columns.include?('|')
      geometry_columns.try(:to_sym)
    else
      nil
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
      user_database.run("alter table #{self.name} add column the_geom geometry")
    end
  ensure
    FileUtils.rm filename
    FileUtils.rm path
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
      results = c.scan(/(["`\'])[^"`\']+(["`\'])/).flatten
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
          results = line[i].scan(/(["`\'])[^"`\']+(["`\'])/).flatten
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

  def set_triggers
    owner.in_database(:as => :superuser) do |user_database|
      user_database.run(<<-TRIGGER
        -- Sets trigger to protect primary key cartodb_id to be updated
        DROP TRIGGER IF EXISTS protect_data_trigger ON #{self.name};

        CREATE OR REPLACE FUNCTION protect_data() RETURNS TRIGGER AS $protect_data_trigger$
          BEGIN
               NEW.cartodb_id := OLD.cartodb_id;
               RETURN NEW;
          END;
        $protect_data_trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER protect_data_trigger
        BEFORE UPDATE ON #{self.name}
            FOR EACH ROW EXECUTE PROCEDURE protect_data();

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

  def geocode_address_column!(address)
    return if address_column.blank?
    url = URI.parse("http://maps.google.com/maps/api/geocode/json?address=#{CGI.escape(address)}&sensor=false")
    req = Net::HTTP::Get.new(url.request_uri)
    res = Net::HTTP.start(url.host, url.port){ |http| http.request(req) }
    json = JSON.parse(res.body)
    if json['status'] == 'OK' && !json['results'][0]['geometry']['location']['lng'].blank? && !json['results'][0]['geometry']['location']['lat'].blank?
      owner.in_database do |user_database|
        user_database.run("UPDATE #{self.name} SET the_geom = PointFromText('POINT(' || #{json['results'][0]['geometry']['location']['lng']} || ' ' || #{json['results'][0]['geometry']['location']['lat']} || ')',4236)")
      end
    end
  end

end
