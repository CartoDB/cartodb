# encoding utf-8

require_relative 'bolt.rb'

module Carto
  class GhostTablesManager
    MUTEX_REDIS_KEY = 'ghost_tables_working'.freeze
    MUTEX_TTL_MS = 60000

    def initialize(user_id)
      @user = ::User.where(id: user_id).first
    end

    def link_ghost_tables(force_sync = false)
      return if consistent?

      if stale_tables_linked? || force_sync
        sync_user_schema_and_tables_metadata
      else
        ::Resque.enqueue(::Resque::UserJobs::SyncTables::LinkGhostTables, @user.id)
      end
    end

    private

    # determine linked tables vs cartodbfied tables consistency; i.e.: needs to run sync
    def consistent?
      cartodbfied_tables.reject(&:unaltered?).empty? && dropped_tables.empty?
    end

    def sync_user_schema_and_tables_metadata
      bolt = Carto::Bolt.new("#{@user.username}:#{MUTEX_REDIS_KEY}", ttl_ms: MUTEX_TTL_MS)

      got_locked = bolt.run_locked { manage_ghost_tables }

      CartoDB::Logger.info(message: 'Ghost table race condition avoided', user: @user) unless got_locked
    end

    def manage_ghost_tables
      link_new_tables
      relink_renamed_tables
      unlink_deleted_tables
    end


    # checks if there're sql-api deleted/renamed tables still linked
    def stale_tables_linked?
      !cartodbfied_tables.select(&:stale?).empty?
    end

    def link_new_tables
      new_tables.each do |metadata_table|
        begin
          CartoDB::Logger.debug(message: 'ghost tables',
                                action: 'linking new table',
                                user: @user,
                                new_table: metadata_table.name)

          table = Table.new

          table.user_id = @user.id
          table.name = metadata_table.name
          table.table_id = metadata_table.id
          table.register_table_only = true
          table.keep_user_database_table = true

          table.save
        rescue => exception
          CartoDB::Logger.error(message: 'Error linking new table',
                                exception: exception,
                                user: @user,
                                table_name: metadata_table.name,
                                table_id: metadata_table.id)
        end
      end
    end

    def relink_renamed_tables
      renamed_tables.each do |cartodbfied_table|
        begin
          new_vis_name = cartodbfied_table.name

          CartoDB::Logger.debug(message: 'ghost tables',
                                action: 'relinking renamed table',
                                user: @user,
                                renamed_table: new_vis_name)

          vis = cartodbfied_table.table.table_visualization
          vis.register_table_only = true
          vis.name = new_vis_name

          vis.store
        rescue Sequel::DatabaseError => exeption
          raise unless exeption.message =~ /must be owner of relation/
        end
      end
    end

    def unlink_deleted_tables
      syncs = CartoDB::Synchronization::Collection.new.fetch(user_id: @user.id).map(&:name).compact

      # Remove tables with oids that don't exist on the db
      # Sync tables replace contents without touching metadata DB, so if method triggers meanwhile sync it will fail
      # TODO: Flag running syncs to distinguish between deleted table syncs and running syncs
      dropped_tables.select { |table| !syncs.include?(table.name) }.each do |linked_table|
        CartoDB::Logger.debug(message: 'ghost tables',
                              action: 'unlinking dropped table',
                              user: @user,
                              dropped_table: linked_table.name)

        linked_table.table.keep_user_database_table = true
        linked_table.table.destroy
      end

      clean_user_tables_with_null_table_id
    end

    def cartodbfied_tables
      @cartodbfied_tables ||= fetch_cartobfied_tables
    end

    # this method searchs for tables with all the columns needed in a cartodb table.
    # it does not check column types, and only the latest cartodbfication trigger attached (test_quota_per_row)
    def fetch_cartobfied_tables
      required_columns = Table::CARTODB_REQUIRED_COLUMNS + [Table::THE_GEOM_WEBMERCATOR]
      cartodb_columns = required_columns.map { |column| "'#{column}'" }.join(',')

      sql = %{
        WITH a as (
          SELECT table_name, table_name::regclass::oid reloid, count(column_name::text) cdb_columns_count
          FROM information_schema.columns c, pg_tables t, pg_trigger tg
          WHERE
            t.tablename = c.table_name AND
            t.schemaname = c.table_schema AND
            c.table_schema = '#{@user.database_schema}' AND
            t.tableowner = '#{@user.database_username}' AND
            column_name IN (#{cartodb_columns}) AND
            tg.tgrelid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass::oid AND
            tg.tgname = 'test_quota_per_row'
          GROUP BY 1)
        SELECT table_name, reloid FROM a WHERE cdb_columns_count = #{required_columns.length}
      }

      @user.in_database(as: :superuser)[sql].all.map do |record|
        Carto::TableRepresentation.new(record[:reloid], record[:table_name], @user)
      end
    end

    # Tables that have been renamed through the SQL API
    def renamed_tables
      cartodbfied_tables.select(&:renamed?)
    end

    # Tables that have been created trhought the SQL API
    def new_tables
      cartodbfied_tables.select(&:new?)
    end

    # Tables that haven't been atlered throught the SQL API
    def untouched_tables?
      cartodbfied_tables.select(&:unaltered?)
    end

    # Tables that have been dropped via API but have an old UserTable
    def dropped_tables
      @dropped_tables ||= find_dropped_tables
    end

    def find_dropped_tables
      linked_tables = @user.tables.all.map do |user_table|
        Carto::TableRepresentation.new(user_table.table_id, user_table.name, @user)
      end

      linked_tables - cartodbfied_tables
    end
  end

  class TableRepresentation
    attr_reader :id, :name, :user

    def initialize(id, name, user)
      @id = id
      @name = name
      @user = user
    end

    # Grabs the Table associated with this LinkedTable.
    def table
      user_tables = ::UserTable.where(table_id: id, user_id: user.id)

      first = user_tables.first

      if user_tables.count > 1
        CartoDB::Logger.warning(message: 'Duplicate UserTables detected', user: user, table_name: first.name)
      end

      first ? Table.new(user_table: first) : nil
    end

    def new?
      !user_table_with_matching_id && !user_table_with_matching_name && physical_table_exists?
    end

    def renamed?
      !!user_table_with_matching_id && !user_table_with_matching_name
    end

    def unaltered?
      !!user_table && physical_table_exists?
    end

    def user_table_with_matching_id
      user.tables.where(table_id: id).first
    end

    def user_table_with_matching_name
      user.tables.where(name: name).first
    end

    def user_table
      user.tables.where(table_id: id, name: name).first
    end

    def physical_table_exists?
      !!fetch_oid_relname
    end

    def fetch_oid_relname
      @user.in_database(as: :superuser)
           .select(:pg_class__oid, :pg_class__relname)
           .from(:pg_class)
           .join_table(:inner, :pg_namespace, oid: :relnamespace)
           .where(relkind: 'r', nspname: user.database_schema, pg_class__oid: id, pg_class__relname: name)
           .first
    end

    def eql?(other)
      id.eql?(other.id) && name.eql?(other.name) && user.id.eql?(other.user.id)
    end

    def ==(other)
      eql?(other)
    end

    def hash
      [id, name, user.id].hash
    end
  end
end
