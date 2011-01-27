# coding: UTF-8

class Table < Sequel::Model(:user_tables)

  # Privacy constants
  PRIVATE = 0
  PUBLIC  = 1

  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:name, :privacy, :tags)

  ## Callbacks
  def validate
    super
    errors.add(:user_id, 'can\'t be blank')  if user_id.blank?
    errors.add(:name,    'can\'t be blank')  if name.blank?
    validates_unique [:name, :user_id], :message => 'is already taken'
  end

  def before_validation
    self.privacy ||= PUBLIC
  end

  # Before creating a user table a table should be created in the database.
  # This table has an empty schema
  def before_create
    update_updated_at
    unless self.user_id.blank? || self.name.blank?
      unless self.name.blank?
        owner.in_database do |user_database|
          unless user_database.table_exists?(self.name.to_sym)
            user_database.create_table self.name.to_sym do
              primary_key :id
              String :name
              column :location, 'geometry'
              String :description, :text => true
              constraint(:enforce_geotype_location){"(geometrytype(location) = 'POINT'::text OR location IS NULL)"}
            end
          end
        end
      end
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
      user_database.add_column name.to_sym, options[:name].to_s, options[:type]
    end
  end

  def drop_column!(options)
    owner.in_database do |user_database|
      user_database.drop_column name.to_sym, options[:name].to_s
    end
  end

  def modify_column!(options)
    owner.in_database do |user_database|
      if options[:old_name] && options[:new_name]
        user_database.rename_column name.to_sym, options[:old_name].to_sym, options[:new_name].to_sym
      end
      if options[:type]
        begin
          user_database.set_column_type name.to_sym, (options[:new_name] || options[:name]).to_sym, options[:type]
        rescue => e
          message = e.message.split("\n").first
          if message =~ /cannot be cast to type/
            user_database.transaction do
              random_name = "new_column_#{rand(10)*Time.now.to_i}"
              user_database.add_column name.to_sym, random_name, options[:type]
              user_database["UPDATE #{name} SET #{random_name}=#{(options[:new_name] || options[:name])}::#{options[:type]}"]
              user_database.drop_column name.to_sym, (options[:new_name] || options[:name]).to_sym
              user_database.rename_column name.to_sym, random_name, (options[:new_name] || options[:name]).to_sym
            end
          end
        end
      end
    end
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

end
