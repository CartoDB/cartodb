# coding: UTF-8
# Proxies management of a table in the users database
require 'forwardable'

require_relative './table/column_typecaster'
require_relative './table/privacy_manager'
require_relative './table/relator'
require_relative './visualization/member'
require_relative './visualization/overlays'
require_relative './overlay/member'
require_relative './overlay/collection'
require_relative './overlay/presenter'
require_relative '../../services/importer/lib/importer/query_batcher'

class Table < Sequel::Model(:user_tables)
  extend Forwardable

  PRIVACY_PRIVATE = 0
  PRIVACY_PUBLIC = 1
  PRIVACY_LINK = 2

  PRIVACY_PRIVATE_TEXT = 'private'
  PRIVACY_PUBLIC_TEXT = 'public'
  PRIVACY_LINK_TEXT = 'link'

  PRIVACY_VALUES_TO_TEXTS = {
      PRIVACY_PRIVATE => PRIVACY_PRIVATE_TEXT,
      PRIVACY_PUBLIC => PRIVACY_PUBLIC_TEXT,
      PRIVACY_LINK => PRIVACY_LINK_TEXT
  }

  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  RESERVED_COLUMN_NAMES = %W{ oid tableoid xmin cmin xmax cmax ctid ogc_fid }
  PUBLIC_ATTRIBUTES = {
      :id                           => :id,
      :name                         => :name,
      :privacy                      => :privacy_text,
      :schema                       => :schema,
      :updated_at                   => :updated_at,
      :rows_counted                 => :rows_estimated,
      :table_size                   => :table_size,
      :map_id                       => :map_id,
      :description                  => :description,
      :geometry_types               => :geometry_types,
      :table_visualization          => :table_visualization,
      :dependent_visualizations     => :serialize_dependent_visualizations,
      :non_dependent_visualizations => :serialize_non_dependent_visualizations,
      :synchronization              => :serialize_synchronization
  }

  DEFAULT_THE_GEOM_TYPE = 'geometry'

  # Associations
  many_to_one  :map
  many_to_many :layers, join_table: :layers_user_tables,
                        left_key:   :user_table_id,
                        right_key:  :layer_id,
                        reciprocal: :user_tables
  one_to_one   :automatic_geocoding
  one_to_many  :geocodings

  plugin :association_dependencies, map:                  :destroy,
                                    layers:               :nullify,
                                    automatic_geocoding:  :destroy
  plugin :dirty

  def_delegators :relator, *CartoDB::TableRelator::INTERFACE

  def public_values(options = {}, viewer_user=nil)
    selected_attrs = if options[:except].present?
      PUBLIC_ATTRIBUTES.select { |k, v| !options[:except].include?(k.to_sym) }
    else
      PUBLIC_ATTRIBUTES
    end

    attrs = Hash[selected_attrs.map{ |k, v| [k, (self.send(v) rescue self[v].to_s)] }]
    if !viewer_user.nil? && !owner.nil? && owner.id != viewer_user.id
      attrs[:name] = "#{owner.sql_safe_database_schema}.#{attrs[:name]}"
    end
    attrs[:table_visualization] = CartoDB::Visualization::Presenter.new(self.table_visualization, { real_privacy: true, user: viewer_user }).to_poro
    attrs
  end

  def default_privacy_values
    self.owner.try(:private_tables_enabled) ? PRIVACY_PRIVATE : PRIVACY_PUBLIC
  end #default_privacy_values

  def geometry_types
    owner.in_database[ %Q{
      SELECT DISTINCT ST_GeometryType(the_geom) FROM (
        SELECT the_geom
        FROM "#{self.name}"
        WHERE (the_geom is not null) LIMIT 10
      ) as foo
    }].all.map {|r| r[:st_geometrytype] }
  end

  def_dataset_method(:search) do |query|
    conditions = <<-EOS
      to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ?) OR name ILIKE ?
      EOS
    where(conditions, query, "%#{query}%")
  end

  def_dataset_method(:multiple_order) do |criteria|
    if criteria.nil? || criteria.empty?
      order(:id)
    else
      order_params = criteria.map do |key, order|
        Sequel.send(order.to_sym, key.to_sym)
      end
      order(*order_params)
    end
  end #multiple_order


  # Ignore mass-asigment on not allowed columns
  self.strict_param_setting = false

  # Allowed columns
  set_allowed_columns(:privacy, :tags, :description)

  attr_accessor :force_schema, :import_from_file,:import_from_url, :import_from_query,
                :import_from_table_copy, :importing_encoding,
                :temporal_the_geom_type, :migrate_existing_table, :new_table, :keep_user_database_table

  # Getter by table uuid or table name using canonical visualizations
  # @param table_id String
  # @param viewer_user User
  def self.get_by_id(table_id, viewer_user)
    table = nil
    return table unless viewer_user

    table_temp = Table.where(id: table_id).first
    unless table_temp.nil?
      vis = CartoDB::Visualization::Collection.new.fetch(
          user_id: viewer_user.id,
          map_id: table_temp.map_id,
          type: CartoDB::Visualization::Member::CANONICAL_TYPE
      ).first
      table = vis.table unless vis.nil?
    end
    table
  end

  # Get a list of tables given an array with the names
  # (can be fully qualified).
  # it also needs the user used to search a table when the
  # name is not qualified
  def self.get_all_by_names(names, viewer_user)
    names.map { |t|
      user_id = viewer_user.id
      table_name, table_schema = Table.table_and_schema(t)
      unless table_schema.nil?
        owner = User.where(username:table_schema).first
        unless owner.nil?
          user_id = owner.id
        end
      end
      Table.where(user_id: user_id, name: table_name).first
    }
  end #tables_from


  # Getter by table uuid or table name using canonical visualizations
  # @param id_or_name String If is a name, can become qualified as "schema.tablename"
  # @param viewer_user User
  def self.get_by_id_or_name(id_or_name, viewer_user)
    return nil unless viewer_user

    rx = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

    table_name, table_schema = self.table_and_schema(id_or_name)

    query_filters = {
        user_id: viewer_user.id,
        name: table_name,
        type: CartoDB::Visualization::Member::CANONICAL_TYPE
    }

    unless table_schema.nil?
      owner = User.where(username:table_schema).first
      unless owner.nil?
        query_filters[:user_id] = owner.id
      end
    end

    vis = CartoDB::Visualization::Collection.new.fetch(query_filters).select { |u|
      u.user_id == query_filters[:user_id]
    }.first
    table = vis.nil? ? nil : vis.table

    if rx.match(id_or_name) && table.nil?
      table_temp = Table.where(id: id_or_name).first
      unless table_temp.nil?
        # Make sure we're allowed to see the table
        vis = CartoDB::Visualization::Collection.new.fetch(
            user_id: viewer_user.id,
            map_id: table_temp.map_id,
            type: CartoDB::Visualization::Member::CANONICAL_TYPE
        ).first
        table = vis.table unless vis.nil?
      end
    end

    table
  end

  def self.table_and_schema(table_name)
    if table_name =~ /\./
      table_name, schema = table_name.split('.').reverse
      # remove quotes from schema
      [table_name, schema.gsub('"', '')]
    else
      [table_name, nil]
    end
  end

  ## Callbacks

  # Core validation method that is automatically called before create and save
  def validate
    super

    ## SANITY CHECKS

    # userid and table name tuple must be unique
    validates_unique [:name, :user_id], :message => 'is already taken'

    # tables must have a user
    errors.add(:user_id, "can't be blank") if user_id.blank?

    errors.add(
      :name, 'is a reserved keyword, please choose a different one'
    ) if self.name == 'layergroup'

    # privacy setting must be a sane value
    if privacy != PRIVACY_PRIVATE && privacy != PRIVACY_PUBLIC && privacy != PRIVACY_LINK
      errors.add(:privacy, "has an invalid value '#{privacy}'")
    end

    # Branch if owner does not have private table privileges
    unless self.owner.try(:private_tables_enabled)
      # If it's a new table and the user is trying to make it private
      if self.new? && privacy == PRIVACY_PRIVATE
        errors.add(:privacy, 'unauthorized to create private tables')
      end

      # if the table exists, is private, but the owner no longer has private privilidges
      if !self.new? && privacy == PRIVACY_PRIVATE && self.changed_columns.include?(:privacy)
        errors.add(:privacy, 'unauthorized to modify privacy status to private')
      end

      # cannot change any existing table to 'with link'
      if !self.new? && privacy == PRIVACY_LINK && self.changed_columns.include?(:privacy)
        errors.add(:privacy, 'unauthorized to modify privacy status to pubic with link')
      end

    end
  end

  # runs before each validation phase on create and update
  def before_validation
    # ensure privacy variable is set to one of the constants. this is bad.
    self.privacy ||= (owner.try(:private_tables_enabled) ? PRIVACY_PRIVATE : PRIVACY_PUBLIC)
    super
  end

  def append_from_importer(new_table_name, new_schema_name)
    new_schema            = owner.in_database.schema(
                              new_table_name,
                              reload: true,
                              schema: new_schema_name
                            )
    new_schema_hash       = Hash[new_schema]
    append_to_table       = self
    new_schema_names      = new_schema.map(&:first)
    existing_schema_hash  = Hash[append_to_table.schema(reload: true)]
    drop_names            = %W{ cartodb_id created_at updated_at ogc_fid}
    configuration         = ::Rails::Sequel.configuration.environment_for(Rails.env)

    # fun schema check here
    new_schema_hash.keys.each do |column_name|
      if RESERVED_COLUMN_NAMES.include?(column_name.to_s) || drop_names.include?(column_name.to_s)
        new_schema_names.delete(column_name)
      elsif column_name.to_s != 'the_geom'
        if existing_schema_hash.keys.include?(column_name)
          # column name exists in new and old table
          if existing_schema_hash[column_name] != new_schema_hash[column_name]
            #the new column type does not match the existing, force change to existing
            column_data = configuration.merge(
              type: existing_schema_hash[column_name][:type].to_s,
              name: column_name
            ).symbolize_keys
            self.modify_column!(column_data)
          end
        else
          # add column and type to old table
          column_data =  configuration.merge(
            type: new_schema_hash[column_name][:type].to_s,
            name: column_name
          ).symbolize_keys
          append_to_table.add_column!(column_data)
        end
      end
    end

    # append table 2 to table 1
    owner.in_database.run(%Q{
      INSERT INTO "#{append_to_table.name}" (
        #{new_schema_names.join(',')}
      )
      (
        SELECT #{new_schema_names.join(',')}
        FROM "#{new_schema_name}"."#{new_table_name}"
      )
    })
  end #append_from_importer

  def append_to_table(options)
    from_table = options[:from_table]
    append_to_table = self
    # if concatenate_to_table is set, it will join the table just created
    # to the table named in concatenate_to_table and then drop the created table
    #get schemas of uploaded and existing tables
    new_schema        = from_table.schema(reload: true)
    new_schema_hash   = Hash[new_schema]
    new_schema_names  = new_schema.collect {|x| x[0]}

    existing_schema_hash = Hash[append_to_table.schema(reload: true)]

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
    owner.in_database.run(%Q{INSERT INTO "#{append_to_table.name}" (#{new_schema_names.join(',')}) (SELECT #{new_schema_names.join(',')} FROM "#{from_table.name}")})
    # so that we can use the same method to allow the user to merge two tables
    # that already exist in the API
    # a future might be merge_two_tables
    # => where tableA is duplicated
    # => then tableB is append_to_table onto tableA
    # => leaving both in tact while creating a new tthat contains both
  end

  def import_to_cartodb(uniname=nil)
    @data_import ||= DataImport.where(id: data_import_id).first || DataImport.new(user_id: owner.id)
    if migrate_existing_table.present? || uniname
      @data_import.data_type = 'external_table'
      @data_import.data_source = migrate_existing_table || uniname
      @data_import.save

      # ensure unique name, also ensures self.name can override any imported table name
      uniname ||= self.name ? get_valid_name(self.name) : get_valid_name(migrate_existing_table)

      # with table #{uniname} table created now run migrator to CartoDBify
      hash_in = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'host' => owner.database_host,
        'database' => owner.database_name,
        :logger => ::Rails.logger,
        'username' => owner.database_username,
        'password' => owner.database_password,
        :schema => owner.database_schema,
        :current_name => migrate_existing_table || uniname,
        :suggested_name => uniname,
        :debug => (Rails.env.development?),
        :remaining_quota => owner.remaining_quota,
        :remaining_tables => owner.remaining_table_quota,
        :data_import_id => @data_import.id
      ).symbolize_keys
      importer = CartoDB::Migrator.new hash_in
      importer = importer.migrate!
      @data_import.reload
      #@data_import.migrated
      @data_import.save
      importer.name
    end
  end

  def import_cleanup
    owner.in_database(:as => :superuser) do |user_database|
      # When tables are created using ogr2ogr they are added a ogc_fid or gid primary key
      # In that case:
      #  - If cartodb_id already exists, remove ogc_fid
      #  - If cartodb_id does not exist, treat this field as the auxiliary column
      aux_cartodb_id_column = nil
      flattened_schema = schema.present? ? schema.flatten : []

      if schema.present?
        if flattened_schema.include?(:ogc_fid)
          aux_cartodb_id_column = 'ogc_fid'
        elsif flattened_schema.include?(:gid)
          aux_cartodb_id_column = 'gid'
        end
      end

      # Remove primary key
      existing_pk = user_database[%Q{
        SELECT c.conname AS pk_name
        FROM pg_class r, pg_constraint c, pg_namespace n
        WHERE r.oid = c.conrelid AND contype='p' AND relname = '#{self.name}'
        AND r.relnamespace = n.oid and n.nspname= '#{owner.database_schema}'
      }].first
      existing_pk = existing_pk[:pk_name] unless existing_pk.nil?
      user_database.run(%Q{
        ALTER TABLE #{qualified_table_name} DROP CONSTRAINT "#{existing_pk}"
      }) unless existing_pk.nil?

      # All normal fields casted to text
      self.schema(reload: true, cartodb_types: false).each do |column|
        if column[1] =~ /^character varying/
          user_database.run(%Q{ALTER TABLE #{qualified_table_name} ALTER COLUMN "#{column[0]}" TYPE text})
        end
      end

      # If there's an auxiliary column, copy to cartodb_id and restart the sequence to the max(cartodb_id)+1
      if aux_cartodb_id_column.present?
        begin
          already_had_cartodb_id = false
          user_database.run(%Q{ALTER TABLE #{qualified_table_name} ADD COLUMN cartodb_id SERIAL})
        rescue
          already_had_cartodb_id = true
        end
        unless already_had_cartodb_id
          user_database.run(%Q{UPDATE #{qualified_table_name} SET cartodb_id = CAST(#{aux_cartodb_id_column} AS INTEGER)})
          cartodb_id_sequence_name = user_database["SELECT pg_get_serial_sequence('#{owner.database_schema}.#{self.name}', 'cartodb_id')"].first[:pg_get_serial_sequence]
          max_cartodb_id = user_database[%Q{SELECT max(cartodb_id) FROM #{qualified_table_name}}].first[:max]
          # only reset the sequence on real imports.
          # skip for duplicate tables as they have totaly new names, but have aux_cartodb_id columns
          if max_cartodb_id
            user_database.run("ALTER SEQUENCE #{cartodb_id_sequence_name} RESTART WITH #{max_cartodb_id+1}")
          end
        end
        user_database.run(%Q{ALTER TABLE #{qualified_table_name} DROP COLUMN #{aux_cartodb_id_column}})
      end

      self.schema(reload:true)
      self.cartodbfy

      user_database.run(%Q{ALTER TABLE #{qualified_table_name} ADD PRIMARY KEY (cartodb_id)})
    end

  end

  def before_create
    raise CartoDB::QuotaExceeded if owner.over_table_quota?
    super
    update_updated_at

    # The Table model only migrates now, never imports
    if migrate_existing_table.present?
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

      self.schema(reload: true)

      set_the_geom_column!

      import_cleanup

      set_table_id
      @data_import.save
    else
      create_table_in_database!
      set_table_id
      unless self.temporal_the_geom_type.blank?
        self.the_geom_type = self.temporal_the_geom_type
        self.temporal_the_geom_type = nil
      end
      set_the_geom_column!(self.the_geom_type)
    end
  rescue => e
    self.handle_creation_error(e)
  end

  def after_create
    super
    self.create_default_map_and_layers
    self.create_default_visualization
    self.send_tile_style_request

    grant_select_to_tiler_user
    set_default_table_privacy

    @force_schema = nil
    $tables_metadata.hset key, 'user_id', user_id
    self.new_table = true

    # finally, close off the data import
    if data_import_id
      @data_import = DataImport.find(id: data_import_id)
      @data_import.table_id   = id
      @data_import.table_name = name
      @data_import.save
    end
    add_table_to_stats

    update_table_pg_stats

    # Cartodbfy !
    self.cartodbfy
  rescue => e
    self.handle_creation_error(e)
  end

  def before_save
    self.updated_at = table_visualization.updated_at if table_visualization
  end #before_save

  def after_save
    super
    manage_tags
    update_name_changes

    self.map.save
    manager = CartoDB::TablePrivacyManager.new(self)
    manager.set_from_table_privacy(privacy)
    manager.propagate_to(table_visualization)
    if privacy_changed?
      manager.propagate_to_redis_and_varnish
      update_cdb_tablemetadata
    end

    affected_visualizations.each { |visualization|
      manager.propagate_to(visualization)
    }
  end

  def propagate_namechange_to_table_vis
    table_visualization.name = name
    table_visualization.store
  end #propagate_namechange_to_table_vis

  def grant_select_to_tiler_user
    owner.in_database(:as => :superuser).run(%Q{GRANT SELECT ON #{qualified_table_name} TO #{CartoDB::TILE_DB_USER};})
  end

  def optimize
    owner.in_database(as: :superuser).run("VACUUM FULL #{qualified_table_name}")
  end

  def handle_creation_error(e)
    CartoDB::Logger.info 'table#create error', "#{e.inspect}"
    # Remove the table, except if it already exists
    unless self.name.blank? || e.message =~ /relation .* already exists/
      @data_import.log << ("Import ERROR: Dropping table #{qualified_table_name}") if @data_import
      $tables_metadata.del key

      self.remove_table_from_user_database
    end
    @data_import.log << ("Import ERROR: #{e.message} Trace: #{e.backtrace}") if @data_import
    raise e
  end

  def create_default_map_and_layers
    m = ::Map.create(::Map::DEFAULT_OPTIONS.merge(table_id: self.id, user_id: self.user_id))
    self.map_id = m.id
    base_layer = ::Layer.new(Cartodb.config[:layer_opts]['base'])
    m.add_layer(base_layer)

    data_layer = ::Layer.new(Cartodb.config[:layer_opts]['data'])
    data_layer.options['table_name'] = self.name
    data_layer.options['user_name'] = self.owner.username
    data_layer.options['tile_style'] = "##{self.name} #{Cartodb.config[:layer_opts]['default_tile_styles'][self.the_geom_type]}"
    data_layer.infowindow ||= {}
    data_layer.infowindow['fields'] = []
    data_layer.tooltip ||= {}
    data_layer.tooltip['fields'] = []
    m.add_layer(data_layer)
  end

  def create_default_visualization
    member = CartoDB::Visualization::Member.new(
      name:         self.name,
      map_id:       self.map_id,
      type:         CartoDB::Visualization::Member::CANONICAL_TYPE,
      description:  self.description,
      tags:         (tags.split(',') if tags),
      privacy:      PRIVACY_VALUES_TO_TEXTS[default_privacy_values],
      user_id:      self.owner.id
    )

    member.store

    CartoDB::Visualization::Overlays.new(member).create_default_overlays
  end



  ##
  # Post the style to the tiler
  #
  def send_tile_style_request(data_layer=nil)
    data_layer ||= self.map.data_layers.first
    tile_request('POST', "/tiles/#{self.name}/style?map_key=#{owner.api_key}", {
      'style_version' => data_layer.options['style_version'],
      'style'         => data_layer.options['tile_style']
    })
  rescue => exception
    raise exception if Rails.env.production? || Rails.env.staging?
  end

  def before_destroy
    @table_visualization                = table_visualization
    if @table_visualization
      @table_visualization.user_data = { name: owner.username, api_key: owner.api_key }
    end
    @dependent_visualizations_cache     = dependent_visualizations.to_a
    @non_dependent_visualizations_cache = non_dependent_visualizations.to_a
    super
  end

  def after_destroy
    super
    # Delete visualization BEFORE deleting metadata, or named map won't be destroyed properly
    @table_visualization.delete(from_table_deletion=true) if @table_visualization
    $tables_metadata.del key
    Tag.filter(:user_id => user_id, :table_id => id).delete
    remove_table_from_stats
    invalidate_varnish_cache
    @dependent_visualizations_cache.each(&:delete)
    @non_dependent_visualizations_cache.each do |visualization|
      visualization.unlink_from(self)
    end
    delete_tile_style
    remove_table_from_user_database unless keep_user_database_table
    synchronization.delete if synchronization
  end

  def remove_table_from_user_database
    owner.in_database(:as => :superuser) do |user_database|
      begin
        user_database.run("DROP SEQUENCE IF EXISTS cartodb_id_#{oid}_seq")
      rescue => e
        CartoDB::Logger.info 'Table#after_destroy error', "maybe table #{qualified_table_name} doesn't exist: #{e.inspect}"
      end
      user_database.run(%Q{DROP TABLE IF EXISTS #{qualified_table_name}})
    end
  end
  ## End of Callbacks

  # This method removes all the vanish cached objects for the table,
  # tiles included. Use with care O:-)
  def invalidate_varnish_cache
    CartoDB::Varnish.new.purge("#{varnish_key}")
    invalidate_cache_for(affected_visualizations) if id && table_visualization
    self
  end

  def invalidate_cache_for(visualizations)
    visualizations.each do |visualization|
      visualization.invalidate_varnish_cache
    end
  end #invalidate_cache_for

  def varnish_key
    if owner.cartodb_extension_version_pre_mu?
      "^#{self.owner.database_name}:(.*#{self.name}.*)|(table)$"
    else
      "^#{self.owner.database_name}:(.*#{owner.database_schema}\\.#{self.name}.*)|(table)$"
    end
  end

  # adds the column if not exists or cast it to timestamp field
  def normalize_timestamp(database, column)
    schema = self.schema(reload: true)

    if schema.nil? || !schema.flatten.include?(column)
      database.run(%Q{
        ALTER TABLE #{qualified_table_name}
        ADD COLUMN #{column} timestamptz
        DEFAULT NOW()
      })
    end

    if schema.present?
      column_type = Hash[schema][column]
      # if column already exists, cast to timestamp value and set default
      if column_type == 'string' && schema.flatten.include?(column)
        success = ms_to_timestamp(database, qualified_table_name, column)
        string_to_timestamp(database, qualified_table_name, column) unless success

        database.run(%Q{
          ALTER TABLE #{qualified_table_name}
          ALTER COLUMN #{column}
          SET DEFAULT now()
        })
      elsif column_type == 'date' || column_type == 'timestamptz'
        database.run(%Q{
          ALTER TABLE #{qualified_table_name}
          ALTER COLUMN #{column}
          SET DEFAULT now()
        })
      end
    end
  end #normalize_timestamp_field

  # @param table String Must come fully qualified from above
  def ms_to_timestamp(database, table, column)
    database.run(%Q{
      ALTER TABLE "#{table}"
      ALTER COLUMN #{column}
      TYPE timestamptz
      USING to_timestamp(#{column}::float / 1000)
    })
    true
  rescue
    false
  end #normalize_ms_to_timestamp

  # @param table String Must come fully qualified from above
  def string_to_timestamp(database, table, column)
    database.run(%Q{
      ALTER TABLE "#{table}"
      ALTER COLUMN #{column}
      TYPE timestamptz
      USING to_timestamp(#{column}, 'YYYY-MM-DD HH24:MI:SS.MS.US')
    })
    true
  rescue
    false
  end #string_to_timestamp

  def make_geom_valid
    begin
      # make timeout here long, but not infinite. 10mins = 600000 ms.
      # TODO: extend .run to take a "long_running" indicator? See #730.
      owner.in_database.run(%Q{SET statement_timeout TO 600000;UPDATE #{qualified_table_name} SET the_geom = ST_MakeValid(the_geom);SET statement_timeout TO DEFAULT})
    rescue => e
      CartoDB::Logger.info 'Table#make_geom_valid error', "table #{qualified_table_name} make valid failed: #{e.inspect}"
    end
  end

  def name=(value)
    value = value.downcase if value
    return if value == self[:name] || value.blank?
    new_name = get_valid_name(value, current_name: self.name)

    # Do not keep track of name changes until table has been saved
    @name_changed_from = self.name if !new? && self.name.present?

    self.invalidate_varnish_cache if !owner.nil? && owner.database_name
    self[:name] = new_name
  end

  def tags=(value)
    return unless value
    self[:tags] = value.split(',').map{ |t| t.strip }.compact.delete_if{ |t| t.blank? }.uniq.join(',')
  end

  def private?
    self.privacy == PRIVACY_PRIVATE
  end #private?

  def public?
    self.privacy == PRIVACY_PUBLIC
  end #public?

  def public_with_link_only?
    self.privacy == PRIVACY_LINK
  end #public_with_link_only?

  def set_default_table_privacy
    self.privacy ||= default_privacy_values
    save
  end

  # enforce standard format for this field
  def privacy=(value)
    case value
      when PRIVACY_PUBLIC_TEXT.upcase, PRIVACY_PUBLIC, PRIVACY_PUBLIC.to_s
        self[:privacy] = PRIVACY_PUBLIC
      when PRIVACY_LINK_TEXT.upcase, PRIVACY_LINK, PRIVACY_LINK.to_s
        self[:privacy] = PRIVACY_LINK
      when PRIVACY_PRIVATE_TEXT.upcase, PRIVACY_PRIVATE, PRIVACY_PRIVATE.to_s
        self[:privacy] = PRIVACY_PRIVATE
      else
        raise "Invalid privacy value '#{value}'"
    end
  end #privacy=

  def privacy_changed?
    previous_changes.keys.include?(:privacy)
  end #privacy_changed?

  def key
    Table.key(owner.database_name, "#{owner.database_schema}.#{name}")
  rescue
    nil
  end

  # @param db_name String
  # @param table_name String Must come fully qualified
  def self.key(db_name, table_name)
    "rails:#{db_name}:#{table_name}"
  end

  def sequel
    owner.in_database.from(sequel_qualified_table_name)
  end

  def rows_estimated_query(query)
    owner.in_database do |user_database|
      rows = user_database["EXPLAIN #{query}"].all
      est = Integer( rows[0].to_s.match( /rows=(\d+)/ ).values_at( 1 )[0] )
      return est
    end
  end

  def rows_estimated(user=nil)
    user ||= self.owner
    user.in_database["SELECT reltuples::integer FROM pg_class WHERE oid = '#{self.name}'::regclass"].first[:reltuples]
  end

  def rows_counted
    sequel.count
  end

  # Returns table size in bytes
  def table_size(user=nil)
    user ||= self.owner
    @table_size ||= Table.table_size(name, connection: user.in_database)
  end

  def self.table_size(name, options)
    options[:connection]['SELECT pg_total_relation_size(?) AS size', name].first[:size] / 2
  rescue Sequel::DatabaseError
    nil
  end

  def schema(options = {})
    first_columns     = []
    middle_columns    = []
    last_columns      = []
    owner.in_database.schema(name, options.slice(:reload).merge(schema: owner.database_schema)).each do |column|
      next if column[0] == THE_GEOM_WEBMERCATOR
      col_db_type = column[1][:db_type].starts_with?('geometry') ? 'geometry' : column[1][:db_type]
      col = [
        column[0],
        # Default/unset or set to true means we want cartodb types
        (options.include?(:cartodb_types) && options[:cartodb_types] == false ? col_db_type : col_db_type.convert_to_cartodb_type),
        col_db_type == 'geometry' ? 'geometry' : nil,
        col_db_type == 'geometry' ? the_geom_type : nil
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
      schema = user_database.schema(name, schema: owner.database_schema, reload: true).map{|c| c.first}
      raw_attributes.delete(:id) unless schema.include?(:id)
      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes.new("Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}")
      end
      begin
        primary_key = user_database.from(name).insert(make_sequel_compatible(attributes))
      rescue Sequel::DatabaseError => e
        message = e.message.split("\n")[0]
        raise message if message =~ /Quota exceeded by/

        invalid_column = nil

        # If the type don't match the schema of the table is modified for the next valid type
        invalid_value = (m = message.match(/"([^"]+)"$/)) ? m[1] : nil
        if invalid_value
          invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
        else
          m = message.match(/PGError: ERROR:  value too long for type (.+)$/)
          if m
            candidate = schema(cartodb_types: false).select{ |c| c[1].to_s == m[1].to_s }.first
            if candidate
              invalid_column = candidate[0]
            end
          end
        end

        if invalid_column.nil?
          raise e
        else
          new_column_type = get_new_column_type(invalid_column)
          user_database.set_column_type(self.name, invalid_column.to_sym, new_column_type)
          retry
        end
      end
    end
    update_the_geom!(raw_attributes, primary_key)
    primary_key
  end

  def update_row!(row_id, raw_attributes)
    rows_updated = 0
    owner.in_database do |user_database|
      schema = user_database.schema(name, schema: owner.database_schema, reload: true).map{|c| c.first}
      raw_attributes.delete(:id) unless schema.include?(:id)

      attributes = raw_attributes.dup.select{ |k,v| schema.include?(k.to_sym) }
      if attributes.keys.size != raw_attributes.keys.size
        raise CartoDB::InvalidAttributes, "Invalid rows: #{(raw_attributes.keys - attributes.keys).join(',')}"
      end

      if attributes.except(THE_GEOM).empty?
        if attributes.size == 1 && attributes.keys == [THE_GEOM]
          rows_updated = 1
        end
      else
        begin
          # update row
          rows_updated = user_database.from(name).filter(:cartodb_id => row_id).update(make_sequel_compatible(attributes))
        rescue Sequel::DatabaseError => e
          # If the type don't match the schema of the table is modified for the next valid type
          # TODO: STOP THIS MADNESS
          message = e.message.split("\n")[0]

          invalid_value = (m = message.match(/"([^"]+)"$/)) ? m[1] : nil
          if invalid_value
            invalid_column = attributes.invert[invalid_value] # which is the column of the name that raises error
            new_column_type = get_new_column_type(invalid_column)
            if new_column_type
              user_database.set_column_type self.name, invalid_column.to_sym, new_column_type
              retry
            end
          else
            raise e
          end
        end
      end
    end
    update_the_geom!(raw_attributes, row_id)
    rows_updated
  end

  # make all identifiers SEQUEL Compatible
  # https://github.com/Vizzuality/cartodb/issues/331
  def make_sequel_compatible(attributes)
    attributes.except(THE_GEOM).convert_nulls.each_with_object({}) { |(k, v), h| h[k.identifier] = v }
  end

  def add_column!(options)
    raise CartoDB::InvalidColumnName if RESERVED_COLUMN_NAMES.include?(options[:name]) || options[:name] =~ /^[0-9_]/
    type = options[:type].convert_to_db_type
    cartodb_type = options[:type].convert_to_cartodb_type
    owner.in_database.add_column name, options[:name].to_s.sanitize, type
    self.invalidate_varnish_cache
    return {:name => options[:name].to_s.sanitize, :type => type, :cartodb_type => cartodb_type}
  rescue => e
    if e.message =~ /^(PG::Error|PGError)/
      raise CartoDB::InvalidType, e.message
    else
      raise e
    end
  end

  def drop_column!(options)
    raise if CARTODB_COLUMNS.include?(options[:name].to_s)
    owner.in_database.drop_column name, options[:name].to_s
    self.invalidate_varnish_cache
  end

  def modify_column!(options)
    old_name  = options.fetch(:name, '').to_s.sanitize
    new_name  = options.fetch(:new_name, '').to_s.sanitize
    raise 'This column cannot be modified' if CARTODB_COLUMNS.include?(old_name.to_s)

    if new_name.present? && new_name != old_name
      rename_column(old_name, new_name)
    end

    column_name = (new_name.present? ? new_name : old_name)
    convert_column_datatype(owner.in_database, name, column_name, options[:type])
    column_type = column_type_for(column_name)
    self.invalidate_varnish_cache
    { name: column_name, type: column_type, cartodb_type: column_type.convert_to_cartodb_type }
  end #modify_column!

  def column_type_for(column_name)
    schema(cartodb_types: false, reload: true).select { |c|
      c[0] == column_name.to_sym
    }.first[1]
  end #column_type_for

  def self.column_names_for(db, table_name, owner)
    db.schema(table_name, schema: owner.database_schema, reload: true).map{ |s| s[0].to_s }
  end #column_names

  def rename_column(old_name, new_name='')
    raise 'Please provide a column name' if new_name.empty?
    raise 'This column cannot be renamed' if CARTODB_COLUMNS.include?(old_name.to_s)

    if new_name =~ /^[0-9_]/ || RESERVED_COLUMN_NAMES.include?(new_name) || CARTODB_COLUMNS.include?(new_name)
      raise CartoDB::InvalidColumnName, 'That column name is reserved, please choose a different one'
    end

    self.owner.in_database do |user_database|
      if Table.column_names_for(user_database, name, self.owner).include?(new_name)
        raise 'Column already exists'
      end
      user_database.rename_column(name, old_name.to_sym, new_name.to_sym)
    end
  end #rename_column

  def convert_column_datatype(database, table_name, column_name, new_type)
    CartoDB::ColumnTypecaster.new(
      user_database:  database,
      schema:         self.owner.database_schema,
      table_name:     table_name,
      column_name:    column_name,
      new_type:       new_type
    ).run
  end #convert_column_datatype

  def records(options = {})
    rows = []
    records_count = 0
    page, per_page = CartoDB::Pagination.get_page_and_per_page(options)
    order_by_column = options[:order_by] || 'cartodb_id'
    mode = (options[:mode] || 'asc').downcase == 'asc' ? 'ASC' : 'DESC NULLS LAST'

    filters = options.slice(:filter_column, :filter_value).reject{|k,v| v.blank?}.values
    where = filters.present? ? "WHERE (#{filters.first})|| '' ILIKE '%#{filters.second}%'" : ''

    owner.in_database do |user_database|
      columns_sql_builder = <<-SQL
      SELECT array_to_string(ARRAY(SELECT '"#{name}"' || '.' || quote_ident(c.column_name)
        FROM information_schema.columns As c
        WHERE table_name = '#{name}'
        AND c.column_name <> 'the_geom_webmercator'
        ), ',') AS column_names
      SQL

      column_names = user_database[columns_sql_builder].first[:column_names].split(',')
      the_geom_index = column_names.index("\"#{name}\".the_geom")
      if the_geom_index
        column_names[the_geom_index] = <<-STR
            CASE
            WHEN GeometryType(the_geom) = 'POINT' THEN
              ST_AsGeoJSON(the_geom,8)
            WHEN (the_geom IS NULL) THEN
              NULL
            ELSE
              'GeoJSON'
            END the_geom
        STR
      end
      select_columns = column_names.join(',')

      # Counting results can be really expensive, so we estimate
      #
      # See https://github.com/Vizzuality/cartodb/issues/716
      #
      max_countable_rows = 65535 # up to this number we accept to count
      rows_count_is_estimated = true
      rows_count = rows_estimated
      if rows_count <= max_countable_rows
        rows_count = rows_counted
        rows_count_is_estimated = false
      end

      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      #
      # NOTE: we fetch one more row to verify estimated rowcount is not short
      #
      rows = user_database[%Q{
        SELECT #{select_columns} FROM #{qualified_table_name} #{where} ORDER BY "#{order_by_column}" #{mode} LIMIT #{per_page}+1 OFFSET #{page}
      }].all
      CartoDB::Logger.info 'Query', "fetch: #{rows.length}"

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
        schema.select{|c| c[0] != THE_GEOM }.map{|c| %Q{"#{c[0]}"} }.join(',') + ',ST_AsGeoJSON(the_geom,8) as the_geom'
      else
        schema.map{|c| %Q{"#{c[0]}"} }.join(',')
      end
      # If we force to get the name from an schema, we avoid the problem of having as
      # table name a reserved word, such 'as'
      row = user_database["SELECT #{select} FROM #{qualified_table_name} WHERE cartodb_id = #{identifier}"].first
    end
    raise if row.nil?
    row
  end

  def run_query(query)
    owner.run_pg_query(query)
  end

  def georeference_from!(options = {})
    if !options[:latitude_column].blank? && !options[:longitude_column].blank?
      set_the_geom_column!('point')

      owner.in_database do |user_database|
        CartoDB::Importer2::QueryBatcher::execute(
            user_database,
            %Q{
            UPDATE #{qualified_table_name}
            SET
              the_geom = ST_GeomFromText(
                'POINT(' || #{options[:longitude_column]} || ' ' || #{options[:latitude_column]} || ')', #{CartoDB::SRID}
              )
            #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
            WHERE REPLACE(TRIM(CAST("#{options[:longitude_column]}" AS text)), ',', '.') ~
              '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND REPLACE(TRIM(CAST("#{options[:latitude_column]}" AS text)), ',', '.')  ~
              '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
            },
            self.name,
            nil,  # QueryBatcher will use a simple internal to console logger
            'georeferencing table rows',
            false,
            (CartoDB::Importer2::QueryBatcher::DEFAULT_BATCH_SIZE/2).round,
            'cartodb_id'
        )
      end
      schema(reload: true)
    else
      raise InvalidArgument
    end
  end


  def the_geom_type
    $tables_metadata.hget(key,'the_geom_type') || DEFAULT_THE_GEOM_TYPE
  end

  def the_geom_type=(value)
    the_geom_type_value = case value.downcase
      when 'geometry'
        'geometry'
      when 'point'
        'point'
      when 'line'
        'multilinestring'
      else
        value !~ /^multi/ ? "multi#{value.downcase}" : value.downcase
    end
    raise CartoDB::InvalidGeomType unless CartoDB::VALID_GEOMETRY_TYPES.include?(the_geom_type_value)
    if owner.in_database.table_exists?(name)
      $tables_metadata.hset(key, 'the_geom_type', the_geom_type_value)
    else
      self.temporal_the_geom_type = the_geom_type_value
    end
  end

  # if the table is already renamed, we just need to update the name attribute
  def synchronize_name(name)
    self[:name] = name
    save
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
    col = 'name'

    table = fetch(%Q{
      SELECT *
      FROM user_tables
      WHERE user_tables.user_id = ?
      AND user_tables.#{col} = ?},
      user_id, identifier
    ).first
    raise RecordNotFound if table.nil?
    table
  end

  def oid
    @oid ||= owner.in_database["SELECT '#{qualified_table_name}'::regclass::oid"].first[:oid]
  end

  # DB Triggers and things

  def has_trigger?(trigger_name)
    owner.in_database(:as => :superuser).select('trigger_name').from(:information_schema__triggers)
      .where(:event_object_catalog => owner.database_name,
             :event_object_table => self.name,
             :trigger_name => trigger_name).count > 0
  end

  def get_index_name(prefix)
    "#{prefix}_#{UUIDTools::UUID.timestamp_create.to_s.gsub('-', '_')}"
  end # get_index_name

  def has_index?(column_name)
    pg_indexes.include? column_name
  end

  def pg_indexes
    owner.in_database(:as => :superuser).fetch(%Q{
      SELECT
        a.attname
      FROM
        pg_class t, pg_class i, pg_index ix, pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = '#{self.name}';
    }).all.map { |t| t[:attname] }
  end

  def cartodbfy
    if owner.cartodb_extension_version_pre_mu?
      schema_name = 'public'
    else
      schema_name = owner.database_schema
    end
    table_name = "#{owner.database_schema}.#{self.name}"

    # Following is equivalent to running "SELECT cartodb.CDB_CartodbfyTable('#{schema_name}','#{table_name}')"
    owner.in_database do |user_database|
      user_database.run(%Q{
        SELECT cartodb._CDB_check_prerequisites('#{schema_name}'::TEXT, '#{table_name}'::REGCLASS);
      })

      user_database.run(%Q{
        SELECT cartodb._CDB_drop_triggers('#{table_name}'::REGCLASS);
      })

      user_database.run(%Q{
        SELECT cartodb._CDB_create_cartodb_id_column('#{table_name}'::REGCLASS);
      })
      user_database.run(%Q{
        SELECT cartodb._CDB_create_timestamp_columns('#{table_name}'::REGCLASS);
      })

      exists_geom_cols = user_database[%Q{
        SELECT cartodb._CDB_create_the_geom_columns('#{table_name}'::REGCLASS);
      }].first

      exists_geoms = "'{" + exists_geom_cols[:_cdb_create_the_geom_columns].join(',') + "}'::BOOLEAN[]"

      # This are the two hot zones
      user_database.run(%Q{
        SELECT cartodb._CDB_populate_the_geom_from_the_geom_webmercator('#{table_name}'::REGCLASS, #{exists_geoms});
      })
      user_database.run(%Q{
        SELECT cartodb._CDB_populate_the_geom_webmercator_from_the_geom('#{table_name}'::REGCLASS, #{exists_geoms});
      })

      user_database.run(%Q{
        SELECT cartodb._CDB_create_triggers('#{schema_name}'::TEXT, '#{table_name}'::REGCLASS);
      })

    end

    self.schema(reload:true)
  end

  def update_table_pg_stats
    owner.in_database[%Q{ANALYZE #{qualified_table_name};}]
  end

  def owner
    @owner ||= User.where(id: self.user_id).first
  end

  def table_style
    self.map.data_layers.first.options['tile_style']
  end

  def data_last_modified
    owner.in_database.select(:updated_at)
                     .from(:cdb_tablemetadata.qualify(:cartodb))
                     .where(tabname: "'#{self.name}'::regclass".lit).first[:updated_at]
  rescue
    nil
  end

  def privacy_text
    PRIVACY_VALUES_TO_TEXTS[self.privacy].upcase
  end #privacy_text

  # Simplify certain privacy values for the vizjson
  def privacy_text_for_vizjson
    privacy == PRIVACY_LINK ? PRIVACY_PUBLIC_TEXT.upcase : privacy_text
  end #privacy_text_for_vizjson

  def relator
    @relator ||= CartoDB::TableRelator.new(Rails::Sequel.connection, self)
  end #relator

  def set_table_id
    self.table_id = self.get_table_id
  end # set_table_id

  def get_table_id
    record = owner.in_database.select(:pg_class__oid)
      .from(:pg_class)
      .join_table(:inner, :pg_namespace, :oid => :relnamespace)
      .where(:relkind => 'r', :nspname => owner.database_schema, :relname => name).first
    record.nil? ? nil : record[:oid]
  end # get_table_id

  # @throws CartoDB::TableError
  def update_name_changes
    if @name_changed_from.present? && @name_changed_from != name
      # update metadata records
      reload
      begin
        $tables_metadata.rename(Table.key(owner.database_name,"#{owner.database_schema}.#{@name_changed_from}"), key)
      rescue StandardError => exception
        exception_to_raise = CartoDB::BaseCartoDBError.new(
            "Table update_name_changes(): '#{@name_changed_from}','#{key}' renaming metadata", exception)
        CartoDB::notify_exception(exception_to_raise, user: owner)
        #raise exception_to_raise
      end

      begin
        owner.in_database.rename_table(@name_changed_from, name)
      rescue StandardError => exception
        exception_to_raise = CartoDB::BaseCartoDBError.new(
            "Table update_name_changes(): '#{@name_changed_from}' doesn't exist", exception)
        CartoDB::notify_exception(exception_to_raise, user: owner)
        #raise exception_to_raise
      end
      propagate_namechange_to_table_vis

      if layers.blank?
        exception_to_raise = CartoDB::TableError.new("Attempt to rename table without layers #{qualified_table_name}")
        CartoDB::notify_exception(exception_to_raise, user: owner)
        #raise exception_to_raise
      end

      layers.each do |layer|
        layer.rename_table(@name_changed_from, name).save
      end
    end
    @name_changed_from = nil
  end

  # @see https://github.com/jeremyevans/sequel#qualifying-identifiers-columntable-names
  def sequel_qualified_table_name
    "#{owner.database_schema}__#{self.name}".to_sym
  end

  def qualified_table_name
    "\"#{owner.database_schema}\".\"#{self.name}\""
  end

  def database_schema
    owner.database_schema
  end

  ############################### Sharing tables ##############################

  # @param [User] organization_user Gives read permission to this user
  def add_read_permission(organization_user)
    perform_table_permission_change('CDB_Organization_Add_Table_Read_Permission', organization_user)
  end

  # @param [User] organization_user Gives read and write permission to this user
  def add_read_write_permission(organization_user)
    perform_table_permission_change('CDB_Organization_Add_Table_Read_Write_Permission', organization_user)
  end

  # @param [User] organization_user Removes all permissions to this user
  def remove_access(organization_user)
    perform_table_permission_change('CDB_Organization_Remove_Access_Permission', organization_user)
  end

  def add_organization_read_permission
    perform_organization_table_permission_change('CDB_Organization_Add_Table_Organization_Read_Permission')
  end

  def add_organization_read_write_permission
    perform_organization_table_permission_change('CDB_Organization_Add_Table_Organization_Read_Write_Permission')
  end

  def remove_organization_access
    perform_organization_table_permission_change('CDB_Organization_Remove_Organization_Access_Permission')
  end

  private

  def update_cdb_tablemetadata
    # TODO: use upsert
    owner.in_database(as: :superuser).run(%Q{
      INSERT INTO cartodb.cdb_tablemetadata (tabname, updated_at)
      VALUES ('#{table_id}', NOW())
    })
  rescue Sequel::DatabaseError
    owner.in_database(as: :superuser).run(%Q{
      UPDATE cartodb.cdb_tablemetadata
      SET updated_at = NOW()
      WHERE tabname = '#{table_id}'
    })
  end

  def update_updated_at
    self.updated_at = Time.now
  end

  def update_updated_at!
    update_updated_at && save_changes
  end

  def get_valid_name(name, options={})
    name_candidates = []
    name_candidates = self.owner.tables.select_map(:name) if owner

    options.merge!(name_candidates: name_candidates)
    unless options[:database_schema].present? || self.owner.nil?
      options.merge!(database_schema: self.owner.database_schema)
    end

    Table.get_valid_table_name(name, options)
  end

  # Gets a valid postgresql table name for a given database
  # See http://www.postgresql.org/docs/9.1/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
  def self.get_valid_table_name(name, options = {})
    # Initial name cleaning
    name = name.to_s.strip #.downcase
    name = 'untitled_table' if name.blank?

    # Valid names start with a letter or an underscore
    name = "table_#{name}" unless name[/^[a-z_]{1}/]

    # Subsequent characters can be letters, underscores or digits
    name = name.gsub(/[^a-z0-9]/,'_').gsub(/_{2,}/, '_')

    # Postgresql table name limit
    name = name[0..45]

    return name if name == options[:current_name]

    database_schema = options[:database_schema].present? ? options[:database_schema] : 'public'

    # We don't want to use an existing table name
    existing_names = options[:name_candidates] || \
      options[:connection]["select relname from pg_stat_user_tables WHERE schemaname='#{database_schema}'"].map(:relname)
    existing_names = existing_names + User::SYSTEM_TABLE_NAMES
    rx = /_(\d+)$/
    count = name[rx][1].to_i rescue 0
    while existing_names.include?(name)
      count = count + 1
      suffix = "_#{count}"
      name = name[0..62-suffix.length]
      name = name[rx] ? name.gsub(rx, suffix) : "#{name}#{suffix}"
      # Re-check for duplicated underscores
      name = name.gsub(/_{2,}/, '_')
    end

    name
  end

  def get_new_column_type(invalid_column)
    flatten_cartodb_schema = schema.flatten
    cartodb_column_type = flatten_cartodb_schema[flatten_cartodb_schema.index(invalid_column.to_sym) + 1]
    flatten_schema = schema(cartodb_types: false).flatten
    flatten_schema[flatten_schema.index(invalid_column.to_sym) + 1]
    CartoDB::NEXT_TYPE[cartodb_column_type]
  end

  def set_the_geom_column!(type = nil)
    if type.nil?
      if self.schema(reload: true).flatten.include?(THE_GEOM)
        if self.schema.select{ |k| k[0] == THE_GEOM }.first[1] == 'geometry'
          row = owner.in_database["select GeometryType(#{THE_GEOM}) FROM #{qualified_table_name} where #{THE_GEOM} is not null limit 1"].first
          if row
            type = row[:geometrytype]
          else
            type = DEFAULT_THE_GEOM_TYPE
          end
        else
          owner.in_database.rename_column(qualified_table_name, THE_GEOM, :the_geom_str)
        end
      else # Ensure a the_geom column, of type point by default
        type = DEFAULT_THE_GEOM_TYPE
      end
    end
    return if type.nil?

    #if the geometry is MULTIPOINT we convert it to POINT
    if type.to_s.downcase == 'multipoint'
      owner.in_database(:as => :superuser) do |user_database|
        user_database.run("SELECT public.AddGeometryColumn('#{owner.database_schema}', '#{self.name}','the_geom_simple',4326, 'GEOMETRY', 2);")
        user_database.run(%Q{UPDATE #{qualified_table_name} SET the_geom_simple = ST_GeometryN(the_geom,1);})
        user_database.run("SELECT DropGeometryColumn('#{owner.database_schema}', '#{self.name}','the_geom');")
        user_database.run(%Q{ALTER TABLE #{qualified_table_name} RENAME COLUMN the_geom_simple TO the_geom;})
      end
      type = 'point'
    end

    #if the geometry is LINESTRING or POLYGON we convert it to MULTILINESTRING and MULTIPOLYGON resp.
    if %w(linestring polygon).include?(type.to_s.downcase)
      owner.in_database(:as => :superuser) do |user_database|
        user_database.run("SELECT public.AddGeometryColumn('#{owner.database_schema}', '#{self.name}','the_geom_simple',4326, 'GEOMETRY', 2);")
        user_database.run(%Q{UPDATE #{qualified_table_name} SET the_geom_simple = ST_Multi(the_geom);})
        user_database.run("SELECT DropGeometryColumn('#{owner.database_schema}', '#{self.name}','the_geom');")
        user_database.run(%Q{ALTER TABLE #{qualified_table_name} RENAME COLUMN the_geom_simple TO the_geom;})
        type = user_database["select GeometryType(#{THE_GEOM}) FROM #{qualified_table_name} where #{THE_GEOM} is not null limit 1"].first[:geometrytype]
      end
    end

    raise "Error: unsupported geometry type #{type.to_s.downcase} in CartoDB" unless CartoDB::VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)

    type = type.to_s.upcase

    self.the_geom_type = type.downcase
    save_changes unless new?
  end

  def create_table_in_database!
    self.name ||= get_valid_name(self.name)

    owner.in_database do |user_database|
      if force_schema.blank?
        user_database.create_table sequel_qualified_table_name do
          column :cartodb_id, 'SERIAL PRIMARY KEY'
          String :name
          String :description, :text => true
          column :created_at, 'timestamp with time zone', :default => Sequel::CURRENT_TIMESTAMP
          column :updated_at, 'timestamp with time zone', :default => Sequel::CURRENT_TIMESTAMP
        end
      else
        sanitized_force_schema = force_schema.split(',').map do |column|
          # Convert existing primary key into a unique key
          if column =~ /^\s*\"([^\"]+)\"(.*)$/
            "#{$1.sanitize} #{$2.gsub(/primary\s+key/i,'UNIQUE')}"
          else
            column.gsub(/primary\s+key/i,'UNIQUE')
          end
        end
        sanitized_force_schema.unshift('cartodb_id SERIAL PRIMARY KEY').
                               unshift('created_at timestamp with time zone').
                               unshift('updated_at timestamp with time zone')
        user_database.run(<<-SQL
          CREATE TABLE #{qualified_table_name} (#{sanitized_force_schema.join(', ')});
          ALTER TABLE  #{qualified_table_name} ALTER COLUMN created_at SET DEFAULT now();
          ALTER TABLE  #{qualified_table_name} ALTER COLUMN updated_at SET DEFAULT now();
        SQL
        )
      end
    end
  end

  def update_the_geom!(attributes, primary_key)
    return unless attributes[THE_GEOM].present? && attributes[THE_GEOM] != 'GeoJSON'
    geojson = attributes[THE_GEOM]

    begin
      obj = JSON.parse(geojson)
      unless obj[:crs].present?
        obj[:crs] = JSON.parse('{"type":"name","properties":{"name":"EPSG:4326"}}');
      end
      geojson = JSON.generate(obj);

      owner.in_database(:as => :superuser).run(%Q{UPDATE #{qualified_table_name} SET the_geom =
      ST_Transform(ST_GeomFromGeoJSON('#{geojson}'),4326) where cartodb_id =
      #{primary_key}})
    rescue
      raise CartoDB::InvalidGeoJSONFormat, 'Invalid geometry'
    end
  end

  def valid_geometry?(feature)
    !feature.nil? && !feature.is_empty?
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
          if tag_names.include?(tag.name)
            tag_names.delete(tag.name)
          else
            tag.destroy
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

  def delete_tile_style
    if owner.organization.nil?
      tile_request('DELETE', "/tiles/#{self.name}/style?map_key=#{owner.api_key}")
    else
      tile_request('DELETE', "/tiles/#{qualified_table_name}/style?map_key=#{owner.api_key}")
    end
  rescue => exception
    CartoDB::Logger.info 'tilestyle#delete error', "#{exception.inspect}"
  end

  def flush_cache
    if owner.organization.nil?
      tile_request('DELETE', "/tiles/#{self.name}/flush_cache?map_key=#{owner.api_key}")
    else
      tile_request('DELETE', "/tiles/#{qualified_table_name}/flush_cache?map_key=#{owner.api_key}")
    end
  rescue => exception
    CartoDB::Logger.info 'cache#flush error', "#{exception.inspect}"
  end

  def tile_request(request_method, request_uri, form = {})
    uri  = "#{owner.username}.#{Cartodb.config[:tiler]['internal']['domain']}"
    port = Cartodb.config[:tiler]['internal']['port'] || 443
    http_req = Net::HTTP.new uri, port
    http_req.use_ssl = Cartodb.config[:tiler]['internal']['protocol'] == 'https' ? true : false
    http_req.verify_mode = OpenSSL::SSL::VERIFY_NONE
    request_headers = {'Host' => uri}
    case request_method
      when 'GET'
        http_res = http_req.request_get(request_uri, request_headers)
      when 'POST'
        http_res = http_req.request_post(request_uri, URI.encode_www_form(form), request_headers)
      when 'DELETE'
        extra_delete_headers = {'Depth' => 'Infinity'}
        http_res = http_req.delete(request_uri, request_headers.merge(extra_delete_headers))
      else
        http_res = nil
    end
    raise "#{http_res.inspect}" unless http_res.is_a?(Net::HTTPOK)
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

  ############################### Sharing tables ##############################

  # @param [String] cartodb_pg_func
  # @param [User] organization_user
  def perform_table_permission_change(cartodb_pg_func, organization_user)
    from_schema = self.owner.username
    table_name = self.name
    to_role_user = organization_user.database_username
    perform_cartodb_function(cartodb_pg_func, from_schema, table_name, to_role_user)
  end

  def perform_organization_table_permission_change(cartodb_pg_func)
    from_schema = self.owner.username
    table_name = self.name
    perform_cartodb_function(cartodb_pg_func, from_schema, table_name)
  end

  def perform_cartodb_function(cartodb_pg_func, *args)
    self.owner.in_database do |user_database|
      query_args = args.join("','")
      user_database.run("SELECT cartodb.#{cartodb_pg_func}('#{query_args}');")
    end
  end

end

