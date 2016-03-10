# coding: UTF-8
# Proxies management of a table in the users database
require 'forwardable'

require_relative './table/column_typecaster'
require_relative './table/privacy_manager'
require_relative './table/relator'
require_relative './table/user_table'
require_relative './visualization/member'
require_relative './visualization/collection'
require_relative './visualization/overlays'
require_relative './visualization/table_blender'
require_relative './overlay/member'
require_relative './overlay/collection'
require_relative './overlay/presenter'
require_relative '../../services/importer/lib/importer/query_batcher'
require_relative '../../services/importer/lib/importer/cartodbfy_time'
require_relative '../../services/datasources/lib/datasources/decorators/factory'
require_relative '../../services/table-geocoder/lib/internal-geocoder/latitude_longitude'
require_relative '../model_factories/layer_factory'
require_relative '../model_factories/map_factory'

require_relative '../../lib/cartodb/stats/user_tables'
require_relative '../../lib/cartodb/stats/importer'

class Table
  extend Forwardable

  SYSTEM_TABLE_NAMES = %w( spatial_ref_sys geography_columns geometry_columns raster_columns raster_overviews cdb_tablemetadata geometry raster )

   # TODO Part of a service along with schema
  # INFO: created_at and updated_at cannot be dropped from existing tables without dropping the triggers first
  CARTODB_REQUIRED_COLUMNS = %W{ cartodb_id the_geom }
  CARTODB_COLUMNS = %W{ cartodb_id created_at updated_at the_geom }
  THE_GEOM_WEBMERCATOR = :the_geom_webmercator
  THE_GEOM = :the_geom
  CARTODB_ID = :cartodb_id

  NO_GEOMETRY_TYPES_CACHING_TIMEOUT = 5.minutes
  GEOMETRY_TYPES_PRESENT_CACHING_TIMEOUT = 24.hours

  # See http://www.postgresql.org/docs/9.3/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
  PG_IDENTIFIER_MAX_LENGTH = 63

  # @see services/importer/lib/importer/column.rb -> RESERVED_WORDS
  # @see config/initializers/carto_db.rb -> RESERVED_COLUMN_NAMES
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

  VALID_GEOMETRY_TYPES = %W{ geometry multipolygon point multilinestring }

  def_delegators :relator, *CartoDB::TableRelator::INTERFACE
  def_delegators :@user_table, *::UserTable::INTERFACE


  def initialize(args = {})
    if args[:user_table].nil?
      @user_table = UserTable.new(args)
    else
      @user_table = args[:user_table]
    end
    # TODO: this probably makes sense only if user_table is not passed as argument
    @user_table.set_service(self)
  end

  # forwardable does not work well with this one
  def layers
    @user_table.layers
  end

  def save
    @user_table.save
    self
  end

  def update(args)
    @user_table.update(args)
    self
  end

  def reload
    @user_table.reload
    self
  end

  # ----------------------------------------------------------------------------

  def public_values(options = {}, viewer_user=nil)
    selected_attrs = options[:except].present? ?
      PUBLIC_ATTRIBUTES.select { |k, v| !options[:except].include?(k.to_sym) } : PUBLIC_ATTRIBUTES

    attrs = Hash[selected_attrs.map{ |k, v|
      [k, (self.send(v) rescue self[v].to_s)]
    }]

    if !viewer_user.nil? && !owner.nil? && owner.id != viewer_user.id
      attrs[:name] = "#{owner.sql_safe_database_schema}.#{attrs[:name]}"
    end
    attrs[:table_visualization] = CartoDB::Visualization::Presenter.new(self.table_visualization,
                                                      { real_privacy: true, user: viewer_user }.merge(options)).to_poro
    attrs
  end

  def default_privacy_value
    self.owner.try(:private_tables_enabled) ? UserTable::PRIVACY_PRIVATE : UserTable::PRIVACY_PUBLIC
  end

  def geometry_types_key
    @geometry_types_key ||= "#{redis_key}:geometry_types"
  end

  def geometry_types
    # default return value
    types = []

    types_str = cache.get geometry_types_key
    if types_str.present?
      # cache hit
      types = JSON.parse(types_str)
    else
      # cache miss, query and store
      types = query_geometry_types
      timeout = types.empty? ? NO_GEOMETRY_TYPES_CACHING_TIMEOUT : GEOMETRY_TYPES_PRESENT_CACHING_TIMEOUT
      cache.setex(geometry_types_key, timeout, types)
    end

    types
  end

  def is_raster?
    schema.select { |key, value| value == 'raster' }.length > 0
  end

  attr_accessor :force_schema,
                :import_from_file,
                :import_from_url,
                :import_from_query,
                :import_from_table_copy,
                :importing_encoding,
                :the_geom_type_value,
                :migrate_existing_table,
                # this flag is used to register table changes only without doing operations on in the database
                # for example when the table is renamed or created. For remove see keep_user_database_table
                :register_table_only,
                :new_table,
                # Handy for rakes and custom ghost table registers, won't delete user table in case of error
                :keep_user_database_table

  # Getter by table uuid using canonical visualizations
  # @param table_id String
  # @param viewer_user ::User
  def self.get_by_id(table_id, viewer_user)
    table = nil
    return table unless viewer_user

    table_temp = UserTable.where(id: table_id).first.service
    unless table_temp.nil?
      vis = CartoDB::Visualization::Collection.new.fetch(
          user_id: viewer_user.id,
          map_id: table_temp.map_id,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL
      ).first
      table = vis.table unless vis.nil?
    end
    table
  end

  # Getter by table uuid using canonical visualizations. No privacy checks
  # @param table_id String
  def self.get_by_table_id(table_id)
    table_temp = UserTable.where(id: table_id).first
    table_temp.service unless table_temp.nil?
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
        owner = ::User.where(username:table_schema).first
        unless owner.nil?
          user_id = owner.id
        end
      end
      UserTable.where(user_id: user_id, name: table_name).first
    }
  end

  # TODO: REFACTOR THIS patch introduced to continue with #3664
  def self.get_all_user_tables_by_names(names, viewer_user)
    names.map { |t|
      user_id = viewer_user.id
      table_name, table_schema = Table.table_and_schema(t)
      unless table_schema.nil?
        owner = ::User.where(username:table_schema).first
        unless owner.nil?
          user_id = owner.id
        end
      end
      Carto::UserTable.where(user_id: user_id, name: table_name).first
    }
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
    ## SANITY CHECKS
    # TODO this should be fully moved to storage

    # Branch if owner does not have private table privileges
    unless self.owner.try(:private_tables_enabled)
      # If it's a new table and the user is trying to make it private
      if self.new? && @user_table.privacy == UserTable::PRIVACY_PRIVATE
        @user_table.errors.add(:privacy, 'unauthorized to create private tables')
      end

      # if the table exists, is private, but the owner no longer has private privileges
      if !self.new? && @user_table.privacy == UserTable::PRIVACY_PRIVATE && @user_table.changed_columns.include?(:privacy)
        @user_table.errors.add(:privacy, 'unauthorized to modify privacy status to private')
      end

      # cannot change any existing table to 'with link'
      if !self.new? && @user_table.privacy == UserTable::PRIVACY_LINK && @user_table.changed_columns.include?(:privacy)
        @user_table.errors.add(:privacy, 'unauthorized to modify privacy status to pubic with link')
      end

    end
  end

  # runs before each validation phase on create and update
  def before_validation
    # ensure privacy variable is set to one of the constants. this is bad.
    @user_table.privacy ||= (owner.try(:private_tables_enabled) ? UserTable::PRIVACY_PRIVATE : UserTable::PRIVACY_PUBLIC)
  end

  def import_to_cartodb(uniname=nil)
    @data_import ||= DataImport.where(id: @user_table.data_import_id).first || DataImport.new(user_id: owner.id)
    if migrate_existing_table.present? || uniname
      @data_import.data_type = DataImport::TYPE_EXTERNAL_TABLE
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
      @data_import.save
      importer.name
    end
  end

  # TODO: basically most if not all of what the import_cleanup does is done by cartodbfy.
  # Consider deletion.
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

          if max_cartodb_id
            user_database.run("ALTER SEQUENCE #{cartodb_id_sequence_name} RESTART WITH #{max_cartodb_id+1}")
          end
        end
        user_database.run(%Q{ALTER TABLE #{qualified_table_name} DROP COLUMN #{aux_cartodb_id_column}})
      end

    end

  end

  def before_create
    raise CartoDB::QuotaExceeded if owner.over_table_quota?

    # The Table model only migrates now, never imports
    if migrate_existing_table.present?
      if @user_table.data_import_id.nil? #needed for non ui-created tables
        @data_import  = DataImport.new(:user_id => self.user_id)
        @data_import.updated_at = Time.now
        @data_import.save
      else
        @data_import  = DataImport.find(:id=>@user_table.data_import_id)
      end

      importer_result_name = import_to_cartodb(name)

      @data_import.reload
      @data_import.table_name = importer_result_name
      @data_import.save

      self[:name] = importer_result_name

      set_the_geom_column!

      import_cleanup
      self.cartodbfy

      @data_import.save
    else
      if !register_table_only.present?
        create_table_in_database!
        set_the_geom_column!(self.the_geom_type)
        self.cartodbfy
      end
    end

    self.schema(reload:true)
    set_table_id
  rescue => e
    self.handle_creation_error(e)
  end

  def after_create
    self.create_default_map_and_layers
    self.create_default_visualization

    grant_select_to_tiler_user
    set_default_table_privacy

    @force_schema = nil
    self.new_table = true

    # finally, close off the data import
    if @user_table.data_import_id
      @data_import = DataImport.find(id: @user_table.data_import_id)
      @data_import.table_id   = id
      @data_import.table_name = name
      @data_import.save

      if !@data_import.privacy.nil?
        if !self.owner.valid_privacy?(@data_import.privacy)
          raise "Error: User '#{self.owner.username}' doesn't have private tables enabled"
        end
        @user_table.privacy = @data_import.privacy
      end

      @user_table.save

      decorator = CartoDB::Datasources::Decorators::Factory.decorator_for(@data_import.service_name)
      if !decorator.nil? && decorator.decorates_layer?
        self.map.layers.each do |layer|
          decorator.decorate_layer!(layer)
          layer.save if decorator.layer_eligible?(layer)  # skip .save if nothing changed
        end
      end
    end
    add_table_to_stats

    update_table_pg_stats

  rescue => e
    handle_creation_error(e)
  end

  def before_save
    @user_table.updated_at = table_visualization.updated_at if table_visualization
  end

  def after_save
    manage_tags
    update_name_changes

    CartoDB::TablePrivacyManager.new(@user_table).apply_privacy_change(self, previous_privacy, privacy_changed?)

    update_cdb_tablemetadata if privacy_changed? || !@name_changed_from.nil?
  end

  def propagate_namechange_to_table_vis
    table_visualization.name = name
    table_visualization.store
  end

  def grant_select_to_tiler_user
    owner.in_database(:as => :superuser).run(%Q{GRANT SELECT ON #{qualified_table_name} TO #{CartoDB::TILE_DB_USER};})
  end

  def optimize
    owner.in_database({as: :superuser, statement_timeout: 3600000}).run("VACUUM FULL #{qualified_table_name}")
  rescue => e
    CartoDB::notify_exception(e, { user: owner })
    false
  end

  def handle_creation_error(e)
    CartoDB::Logger.info 'table#create error', "#{e.inspect}"
    # Remove the table, except if it already exists
    unless self.name.blank? || e.message =~ /relation .* already exists/
      @data_import.log.append ("Import ERROR: Dropping table #{qualified_table_name}") if @data_import

      self.remove_table_from_user_database unless keep_user_database_table
    end
    @data_import.log.append ("Import ERROR: #{e.message} Trace: #{e.backtrace}") if @data_import
    raise e
  end

  def default_baselayer_for_user(user=nil)
    user ||= self.owner
    basemap = user.default_basemap
    if basemap['className'] === 'googlemaps'
      {
        kind: 'gmapsbase',
        options: basemap
      }
    else
      {
        kind: 'tiled',
        options: basemap.merge({ 'urlTemplate' => basemap['url'] })
      }
    end
  end

  def create_default_map_and_layers
    base_layer = ::ModelFactories::LayerFactory.get_default_base_layer(owner)

    map = ::ModelFactories::MapFactory.get_map(base_layer, user_id, id)
    @user_table.map_id = map.id

    map.add_layer(base_layer)

    data_layer = ::ModelFactories::LayerFactory.get_default_data_layer(name, owner, the_geom_type)
    map.add_layer(data_layer)

    if base_layer.supports_labels_layer?
      labels_layer = ::ModelFactories::LayerFactory.get_default_labels_layer(base_layer)
      map.add_layer(labels_layer)
    end
  end

  def create_default_visualization
    kind = is_raster? ? CartoDB::Visualization::Member::KIND_RASTER : CartoDB::Visualization::Member::KIND_GEOM

    member = CartoDB::Visualization::Member.new(
      name:         self.name,
      map_id:       self.map_id,
      type:         CartoDB::Visualization::Member::TYPE_CANONICAL,
      description:  @user_table.description,
      tags:         (@user_table.tags.split(',') if @user_table.tags),
      privacy:      UserTable::PRIVACY_VALUES_TO_TEXTS[default_privacy_value],
      user_id:      self.owner.id,
      kind:         kind
    )

    member.store
    member.map.recalculate_bounds!
    member.map.recenter_using_bounds!
    member.map.recalculate_zoom!

    CartoDB::Visualization::Overlays.new(member).create_default_overlays
  end

  def before_destroy
    @table_visualization                = table_visualization
    if @table_visualization
      @table_visualization.user_data = { name: owner.username, api_key: owner.api_key }
    end
    @dependent_visualizations_cache     = dependent_visualizations.to_a
    @non_dependent_visualizations_cache = non_dependent_visualizations.to_a
  end

  def after_destroy
    # Delete visualization BEFORE deleting metadata, or named map won't be destroyed properly
    @table_visualization.delete(from_table_deletion=true) if @table_visualization
    Tag.filter(user_id: user_id, table_id: id).delete
    remove_table_from_stats

    cache.del geometry_types_key
    @dependent_visualizations_cache.each(&:delete)
    @non_dependent_visualizations_cache.each do |visualization|
      visualization.unlink_from(self)
    end

    update_cdb_tablemetadata if real_table_exists?
    remove_table_from_user_database unless keep_user_database_table
    synchronization.delete if synchronization

    related_templates.each { |template| template.destroy }
  end

  def remove_table_from_user_database
    owner.in_database(:as => :superuser) do |user_database|
      begin
        user_database.run("DROP SEQUENCE IF EXISTS cartodb_id_#{oid}_seq")
      rescue => e
        CartoDB::Logger.info 'Table#after_destroy error', "maybe table #{qualified_table_name} doesn't exist: #{e.inspect}"
      end
      Carto::OverviewsService.new(user_database).delete_overviews qualified_table_name
      user_database.run(%{DROP TABLE IF EXISTS #{qualified_table_name}})
    end
  end

  def real_table_exists?
    !get_table_id.nil?
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
      owner.in_database({statement_timeout: 600000}).run(%Q{UPDATE #{qualified_table_name} SET the_geom = ST_MakeValid(the_geom);})
    rescue => e
      CartoDB::Logger.info 'Table#make_geom_valid error', "table #{qualified_table_name} make valid failed: #{e.inspect}"
    end
  end

  def name=(value)
    value = value.downcase if value
    return if value == @user_table[:name] || value.blank?
    new_name = get_valid_name(value, current_name: self.name)

    # Do not keep track of name changes until table has been saved
    unless new?
      @name_changed_from = @user_table.name if @user_table.name.present?
      update_cdb_tablemetadata
    end

    @user_table[:name] = new_name
  end

  def set_default_table_privacy
    @user_table.privacy ||= default_privacy_value
    save
  end

  def privacy_changed?
     @user_table.previous_changes && @user_table.previous_changes.keys.include?(:privacy)
  end

  def redis_key
    key ||= "rails:table:#{id}"
  end

  # TODO: change name and refactor for ActiveRecord
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

  # Preferred: `actual_row_count`
  def rows_counted
    actual_row_count
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

      calculate_the_geom_type if column[0] == :the_geom

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
          # INFO: There's a complex logic for retrying and need to know how often it is actually done
          Rollbar.report_message('Retrying insert_row!',
                                 'debug',
                                 {user_id: self.user_id, qualified_table_name: self.qualified_table_name, raw_attributes: raw_attributes})
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
              # INFO: There's a complex logic for retrying and need to know how often it is actually done
              Rollbar.report_message('Retrying update_row!',
                                     'debug',
                                     {user_id: self.user_id, qualified_table_name: self.qualified_table_name, row_id: row_id, raw_attributes: raw_attributes})
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
    raise CartoDB::InvalidColumnName if RESERVED_COLUMN_NAMES.include?(options[:name]) || options[:name] =~ /^[0-9]/
    type = options[:type].convert_to_db_type
    cartodb_type = options[:type].convert_to_cartodb_type
    column_name = options[:name].to_s.sanitize_column_name
    owner.in_database.add_column name, column_name, type

    update_cdb_tablemetadata
    return {:name => column_name, :type => type, :cartodb_type => cartodb_type}
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

    update_cdb_tablemetadata
  end

  def modify_column!(options)
    old_name  = options.fetch(:name, '').to_s.sanitize
    new_name  = options.fetch(:new_name, '').to_s.sanitize
    raise 'This column cannot be modified' if CARTODB_COLUMNS.include?(old_name.to_s)

    if new_name.present? && new_name != old_name
      new_name = new_name.sanitize_column_name
      rename_column(old_name, new_name)
    end

    column_name = (new_name.present? ? new_name : old_name)
    convert_column_datatype(owner.in_database, name, column_name, options[:type])
    column_type = column_type_for(column_name)

    update_cdb_tablemetadata
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

    if new_name =~ /^[0-9]/ || RESERVED_COLUMN_NAMES.include?(new_name) || CARTODB_COLUMNS.include?(new_name)
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
  end

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
    owner.db_service.run_pg_query(query)
  end

  def georeference_from!(options = {})
    if !options[:latitude_column].blank? && !options[:longitude_column].blank?
      set_the_geom_column!('point')

      owner.in_database do |user_database|
        CartoDB::InternalGeocoder::LatitudeLongitude.new(user_database).geocode(owner.database_schema, self.name, options[:latitude_column], options[:longitude_column])
      end
      schema(reload: true)
    else
      raise InvalidArgument
    end
  end

  def the_geom_type
    self.the_geom_type_value
  end

  def the_geom_type=(value)
    self.the_geom_type_value = case value.downcase
      when 'geometry'
        'geometry'
      when 'point'
        'point'
      when 'line'
        'multilinestring'
      when 'multipoint'
        'point'
      else
        value !~ /^multi/ ? "multi#{value.downcase}" : value.downcase
    end
    raise CartoDB::InvalidGeomType.new(self.the_geom_type_value) unless VALID_GEOMETRY_TYPES.include?(self.the_geom_type_value)
  end

  # if the table is already renamed, we just need to update the name attribute
  def synchronize_name(name)
    self[:name] = name
    save
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
    start = Time.now
    schema_name = owner.database_schema
    table_name = "#{owner.database_schema}.#{self.name}"

    importer_stats.timing('cartodbfy') do
      owner.in_database do |user_database|
        user_database.run(%Q{
          SELECT cartodb.CDB_CartodbfyTable('#{schema_name}'::TEXT,'#{table_name}'::REGCLASS);
        })
      end
    end

    elapsed = Time.now - start
    if @data_import
      CartoDB::Importer2::CartodbfyTime::instance(@data_import.id).add(elapsed)
    end
  rescue => exception
    if !!(exception.message =~ /Error: invalid cartodb_id/)
      raise CartoDB::CartoDBfyInvalidID
    else
      raise CartoDB::CartoDBfyError
    end
  end

  def update_table_pg_stats
    owner.in_database[%Q{ANALYZE #{qualified_table_name};}]
  end

  def update_table_geom_pg_stats
    owner.in_database[%Q{ANALYZE #{qualified_table_name}(the_geom);}]
  end

  def owner
    @owner ||= ::User[self.user_id]
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

  # Simplify certain privacy values for the vizjson
  def privacy_text_for_vizjson
    privacy == UserTable::PRIVACY_LINK ? 'PUBLIC' : @user_table.privacy_text
  end

  def relator
    @relator ||= CartoDB::TableRelator.new(Rails::Sequel.connection, self)
  end #relator

  def set_table_id
    @user_table.table_id = self.get_table_id
  end

  def get_table_id
    record = owner.in_database.select(:pg_class__oid)
      .from(:pg_class)
      .join_table(:inner, :pg_namespace, :oid => :relnamespace)
      .where(:relkind => 'r', :nspname => owner.database_schema, :relname => name).first
    record.nil? ? nil : record[:oid]
  end # get_table_id

  def update_name_changes
    if @name_changed_from.present? && @name_changed_from != name
      reload

      unless register_table_only
        begin
          #  Underscore prefixes have a special meaning in PostgreSQL, hence the ugly hack
          Carto::OverviewsService.new(owner.in_database).rename_overviews @name_changed_from, name
          if name.start_with?('_')
            temp_name = "t" + "#{9.times.map { rand(9) }.join}" + name
            owner.in_database.rename_table(@name_changed_from, temp_name)
            owner.in_database.rename_table(temp_name, name)
          else
            owner.in_database.rename_table(@name_changed_from, name)
          end
        rescue StandardError => exception
          exception_to_raise = CartoDB::BaseCartoDBError.new(
              "Table update_name_changes(): '#{@name_changed_from}' doesn't exist", exception)
          CartoDB::notify_exception(exception_to_raise, user: owner)
          raise exception_to_raise
        end
      end

      begin
        propagate_namechange_to_table_vis
        if @user_table.layers.blank?
          exception_to_raise = CartoDB::TableError.new("Attempt to rename table without layers #{qualified_table_name}")
          CartoDB::notify_exception(exception_to_raise, user: owner)
        else
          @user_table.layers.each do |layer|
            layer.rename_table(@name_changed_from, name).save
          end
        end
      rescue exception
        CartoDB::report_exception(exception,
                                  "Failed while renaming visualization #{@name_changed_from} to #{name}",
                                  user: owner)
        raise exception
      end
    end
    @name_changed_from = nil
  end

  # @see https://github.com/jeremyevans/sequel#qualifying-identifiers-columntable-names
  def sequel_qualified_table_name
    Sequel.qualify(owner.database_schema, @user_table.name)
  end

  def qualified_table_name
    "\"#{owner.database_schema}\".\"#{@user_table.name}\""
  end

  def database_schema
    owner.database_schema
  end

  # INFO: Qualified but without double quotes
  def self.is_qualified_name_valid?(name)
    (name =~ /^[a-z\-_0-9]+\.[a-z\-_0-9]+?$/) == 0
  end

  ############################### Sharing tables ##############################

  # @param [::User] organization_user Gives read permission to this user
  def add_read_permission(organization_user)
    perform_table_permission_change('CDB_Organization_Add_Table_Read_Permission', organization_user)
  end

  # @param [::User] organization_user Gives read and write permission to this user
  def add_read_write_permission(organization_user)
    perform_table_permission_change('CDB_Organization_Add_Table_Read_Write_Permission', organization_user)
  end

  # @param [::User] organization_user Removes all permissions to this user
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

  # Estimated row count and size
  def row_count_and_size
    begin
      # Keep in sync with lib/sql/scripts-available/CDB_Quota.sql -> CDB_UserDataSize()
      size_calc = is_raster? ? "pg_total_relation_size('\"' || ? || '\".\"' || relname || '\"')"
                                    : "pg_total_relation_size('\"' || ? || '\".\"' || relname || '\"') / 2"

      data = owner.in_database.fetch(%Q{
            SELECT
              #{size_calc} AS size,
              reltuples::integer AS row_count
            FROM pg_class
            WHERE relname = ?
          },
          owner.database_schema,
          name
        ).first
    rescue => exception
      data = nil
      # INFO: we don't want code to fail because of SQL error
      CartoDB.notify_exception(exception)
    end
    data = { size: nil, row_count: nil } if data.nil?

    data
  end

  def estimated_row_count
    row_count_and_size = self.row_count_and_size
    row_count_and_size.nil? ? nil : row_count_and_size[:row_count]
  end

  def actual_row_count
    sequel.count
  end

  def beautify_name(name)
    return name unless name
    name.tr('_', ' ').split.map(&:capitalize).join(' ')
  end

  def update_cdb_tablemetadata
    owner.in_database(as: :superuser).run(%{
      SELECT CDB_TableMetadataTouch('#{qualified_table_name}')
      })
  end

  private

  def previous_privacy
    # INFO: @user_table.initial_value(:privacy) weirdly returns incorrect value so using changes index instead
    privacy_changed? ? @user_table.previous_changes[:privacy].first : nil
  end

  def importer_stats
    @importer_stats ||= CartoDB::Stats::Importer.instance
  end

  def calculate_the_geom_type
    return self.the_geom_type if self.the_geom_type.present?

    calculated = geometry_types.first
    calculated = calculated.present? ? calculated.downcase.sub('st_', '') : DEFAULT_THE_GEOM_TYPE
    self.the_geom_type = calculated
  end

  def query_geometry_types
    # We do not query the DB, if the_geom does not exist we just recover
    begin
      owner.in_database[ %Q{
        SELECT DISTINCT ST_GeometryType(the_geom) FROM (
          SELECT the_geom
        FROM #{qualified_table_name}
          WHERE (the_geom is not null) LIMIT 10
        ) as foo
      }].all.map {|r| r[:st_geometrytype] }
    rescue
      []
    end
  end

  def cache
    @cache ||= $tables_metadata
  end

  def get_valid_name(name, options={})
    name_candidates = []
    name_candidates = self.owner.tables.select_map(:name) if owner

    options.merge!(name_candidates: name_candidates)
    options.merge!(connection: self.owner.connection) unless self.owner.nil?
    unless options[:database_schema].present? || self.owner.nil?
      options.merge!(database_schema: self.owner.database_schema)
    end

    Table.get_valid_table_name(name, options)
  end

  # Gets a valid postgresql table name for a given database
  # See http://www.postgresql.org/docs/9.3/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
  def self.get_valid_table_name(name, options = {})
    # Initial name cleaning
    name = name.to_s.squish #.downcase
    name = 'untitled_table' if name.blank?

    # Valid names start with a letter. Table names which start
    # with an underscore are unsupported
    # see http://stackoverflow.com/questions/26631976/how-to-rename-a-postgresql-table-by-prefixing-an-underscore

    name = "table_#{name}" unless name[/^[a-z]{1}/]

    # Subsequent characters can be letters, underscores or digits
    name = name.gsub(/[^a-z0-9]/,'_').gsub(/_{2,}/, '_')

    # Postgresql table name limit
    name = name[0...PG_IDENTIFIER_MAX_LENGTH]

    return name if name == options[:current_name]

    name = "#{name}_t" if UserTable::RESERVED_TABLE_NAMES.include?(name)

    database_schema = options[:database_schema].present? ? options[:database_schema] : 'public'

    # We don't want to use an existing table name
    #
    existing_names = []
    existing_names = options[:name_candidates] || options[:connection]["select relname from pg_stat_user_tables WHERE schemaname='#{database_schema}'"].map(:relname) if options[:connection]
    existing_names = existing_names + SYSTEM_TABLE_NAMES
    rx = /_(\d+)$/
    count = name[rx][1].to_i rescue 0
    while existing_names.include?(name)
      count = count + 1
      suffix = "_#{count}"
      name = name[0...PG_IDENTIFIER_MAX_LENGTH-suffix.length]
      name = name[rx] ? name.gsub(rx, suffix) : "#{name}#{suffix}"
      # Re-check for duplicated underscores
      name = name.gsub(/_{2,}/, '_')
    end

    name
  end

  def self.sanitize_columns(table_name, options={})
    connection = options.fetch(:connection)
    database_schema = options.fetch(:database_schema, 'public')

    connection.schema(table_name, schema: database_schema, reload: true).each do |column|
      column_name = column[0].to_s
      column_type = column[1][:db_type]
      column_name = ensure_column_has_valid_name(table_name, column_name, options)
      if column_type == 'unknown'
        CartoDB::ColumnTypecaster.new(
          user_database:  connection,
          schema:         database_schema,
          table_name:     table_name,
          column_name:    column_name,
          new_type:       'text'
          ).run
      end
    end
  end

  def self.ensure_column_has_valid_name(table_name, column_name, options={})
    connection = options.fetch(:connection)
    database_schema = options.fetch(:database_schema, 'public')

    valid_column_name = get_valid_column_name(table_name, column_name, options)
    if valid_column_name != column_name
      connection.run(%Q{ALTER TABLE "#{database_schema}"."#{table_name}" RENAME COLUMN "#{column_name}" TO "#{valid_column_name}";})
    end

    valid_column_name
  end

  def self.get_valid_column_name(table_name, candidate_column_name, options={})
    reserved_words = options.fetch(:reserved_words, [])

    existing_names = get_column_names(table_name, options) - [candidate_column_name]

    candidate_column_name = 'untitled_column' if candidate_column_name.blank?
    candidate_column_name = candidate_column_name.to_s.squish

    # Subsequent characters can be letters, underscores or digits
    candidate_column_name = candidate_column_name.gsub(/[^a-z0-9]/,'_').gsub(/_{2,}/, '_')

    # Valid names start with a letter or an underscore
    candidate_column_name = "column_#{candidate_column_name}" unless candidate_column_name[/^[a-z_]{1}/]

    # Avoid collisions
    count = 1
    new_column_name = candidate_column_name
    while existing_names.include?(new_column_name) || reserved_words.include?(new_column_name.upcase)
      suffix = "_#{count}"
      new_column_name = candidate_column_name[0..PG_IDENTIFIER_MAX_LENGTH-suffix.length] + suffix
      count += 1
    end

    new_column_name
  end

  def self.get_column_names(table_name, options={})
    connection = options.fetch(:connection)
    database_schema = options.fetch(:database_schema, 'public')
    table_schema = connection.schema(table_name, schema: database_schema, reload: true)
    table_schema.map { |column| column[0].to_s }
  end

  def get_new_column_type(invalid_column)
    next_cartodb_type = {
      "number" => "double precision",
      "string" => "text"
    }

    flatten_cartodb_schema = schema.flatten
    cartodb_column_type = flatten_cartodb_schema[flatten_cartodb_schema.index(invalid_column.to_sym) + 1]
    flatten_schema = schema(cartodb_types: false).flatten
    flatten_schema[flatten_schema.index(invalid_column.to_sym) + 1]
    next_cartodb_type[cartodb_column_type]
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

    raise "Error: unsupported geometry type #{type.to_s.downcase} in CartoDB" unless VALID_GEOMETRY_TYPES.include?(type.to_s.downcase)

    type = type.to_s.upcase

    self.the_geom_type = type.downcase
    @user_table.save_changes unless @user_table.new?
  end

  def create_table_in_database!
    self.name ||= get_valid_name(self.name)

    owner.in_database do |user_database|
      if force_schema.blank?
        user_database.create_table sequel_qualified_table_name do
          column :cartodb_id, 'SERIAL PRIMARY KEY'
          String :name
          String :description, :text => true
        end
      else
        sanitized_force_schema = force_schema.split(',').map do |column|
          # Convert existing primary key into a unique key
          if column =~ /\A\s*\"([^\"]+)\"(.*)\z/
            "#{$1.sanitize} #{$2.gsub(/primary\s+key/i,'UNIQUE')}"
          else
            column.gsub(/primary\s+key/i,'UNIQUE')
          end
        end
        sanitized_force_schema.unshift('cartodb_id SERIAL PRIMARY KEY')
        user_database.run(<<-SQL
          CREATE TABLE #{qualified_table_name} (#{sanitized_force_schema.join(', ')});
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
    rescue => e
      raise CartoDB::InvalidGeoJSONFormat, "Invalid geometry: #{e.message}"
    end
  end

  def manage_tags
    if @user_table[:tags].blank?
      Tag.filter(:user_id => user_id, :table_id => id).delete
    else
      tag_names = @user_table.tags.split(',')
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

  def add_table_to_stats
    CartoDB::Stats::UserTables.instance.update_tables_counter(1)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_user(1, self.owner.username)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_host(1)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_plan(1, self.owner.account_type)
  end

  def remove_table_from_stats
    CartoDB::Stats::UserTables.instance.update_tables_counter(-1)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_user(-1, self.owner.username)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_host(-1)
    CartoDB::Stats::UserTables.instance.update_tables_counter_per_plan(-1, self.owner.account_type)
  end

  ############################### Sharing tables ##############################

  # @param [String] cartodb_pg_func
  # @param [::User] organization_user
  def perform_table_permission_change(cartodb_pg_func, organization_user)
    from_schema = self.owner.database_schema
    table_name = self.name
    to_role_user = organization_user.database_username
    perform_cartodb_function(cartodb_pg_func, from_schema, table_name, to_role_user)
  end

  def perform_organization_table_permission_change(cartodb_pg_func)
    from_schema = self.owner.database_schema
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
