# coding: UTF-8

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:name, :privacy, :tags)

  attr_accessor :force_schema, :import_from_file

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
    guess_schema if force_schema.blank? && !import_from_file.blank?
    unless self.user_id.blank? || self.name.blank?
      owner.in_database do |user_database|
        if !user_database.table_exists?(self.name.to_sym)
          if force_schema.blank?
            user_database.create_table self.name.to_sym do
              primary_key :id
              String :name
              column :location, 'geometry'
              String :description, :text => true
              constraint(:enforce_geotype_location){"(geometrytype(location) = 'POINT'::text OR location IS NULL)"}
            end
          else
            sanitized_force_schema = force_schema.split(',').map do |column|
              if column =~ /^\s*\"([^\"]+)\"(.*)$/
                "#{$1.sanitize} #{$2}"
              else
                column
              end
            end
            user_database.run("CREATE TABLE #{self.name} (#{sanitized_force_schema.join(', ')})")
          end
        end
      end
      import_data! unless import_from_file.nil?
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

  def execute_sql(sql)
    update_updated_at!
    owner.in_database do |user_database|
      user_database[name.to_sym].with_sql(sql).all
    end
  end

  def insert_row!(attributes)
    owner.in_database do |user_database|
      attributes = attributes.dup.select{ |k,v| user_database[name.to_sym].columns.include?(k.to_sym) }
      user_database[name.to_sym].insert(attributes) unless attributes.empty?
    end
  end

  def update_row!(row_id, attributes)
    owner.in_database do |user_database|
      attributes = attributes.dup.select{ |k,v| user_database[name.to_sym].columns.include?(k.to_sym) }
      user_database[name.to_sym].filter(:id => row_id).update(attributes) unless attributes.empty?
    end
  end

  def schema
    owner.in_database do |user_database|
      user_database.schema(name.to_sym).map{ |c| [c.first, c[1][:db_type]] }
    end
  end

  def add_column!(options)
    owner.in_database do |user_database|
      user_database.add_column name.to_sym, options[:name].to_s.sanitize, options[:type]
    end
    return {:name => options[:name].to_s.sanitize, :type => options[:type]}
  end

  def drop_column!(options)
    owner.in_database do |user_database|
      user_database.drop_column name.to_sym, options[:name].to_s
    end
  end

  def modify_column!(options)
    new_name = options[:name]
    new_type = options[:type]
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        user_database.rename_column name.to_sym, options[:old_name].to_sym, options[:new_name].sanitize.to_sym
        new_name = options[:new_name].sanitize
      end
      if options[:type]
        column_name = (options[:new_name] || options[:name]).sanitize
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
    return {:name => new_name, :type => new_type}
  end

  def to_json(options = {})
    rows, columns = [], []
    limit      = (options[:rows_per_page] || 10).to_i
    offset     = (options[:page] || 0).to_i*limit
    (options[:owner] || owner).in_database do |user_database|
      columns = user_database.schema(name.to_sym).map{ |c| [c.first, c[1][:db_type]] }
      rows    = user_database[name.to_sym].limit(limit,offset).all
    end
    {
      :total_rows => rows_counted,
      :columns => columns,
      :rows => rows
    }
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

  def import_data!
    return if self.import_from_file.nil?
    path = if import_from_file.respond_to?(:tempfile)
      import_from_file.tempfile.path
    else
      import_from_file.path
    end
    filename = "#{Rails.root}/tmp/importing_csv_#{self.user_id}.csv"
    system("awk 'NR>1{print $0}' #{path} > #{filename}")
    owner.in_database(:as => :superuser) do |user_database|
      # user_database.run("copy #{self.name} from '#{filename}' WITH CSV")
      #  QUOTE AS '`'"
      user_database.run("copy #{self.name} from '#{filename}' WITH DELIMITER '#{@col_separator || ','}' CSV")
    end
  ensure
    FileUtils.rm filename
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

end
