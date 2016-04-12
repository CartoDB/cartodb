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

    def sync_user_schema_and_tables_metadata
      bolt = Carto::Bolt.new("#{@user.id}:#{MUTEX_REDIS_KEY}", ttl_ms: MUTEX_TTL_MS)

      got_locked = bolt.run_locked do
        unless non_linked_tables.empty?
          relink_renamed_tables
          link_new_tables
        end

        unlink_deleted_tables
      end

      CartoDB::Logger.info(message: 'Ghost table race condition avoided', user: @user) unless got_locked
    end

    # determine linked tables vs cartodbfied tables consistency; i.e.: needs to run sync
    def consistent?
      non_linked_tables.empty? && dropped_tables.empty?
    end

    # checks if there're sql-api deleted/renamed tables still linked
    def stale_tables_linked?
      !(dropped_tables.empty? && renamed_tables.empty?)
    end

    def mutex_redis_key
      "rails:users:#{@user.username}:#{MUTEX_REDIS_KEY}"
    end

    def relink_renamed_tables
      renamed_tables.each do |metadata_table|
        begin
          CartoDB.notify_debug('ghost tables', action: 'relinking renamed table', renamed_table: metadata_table.name)

          vis = metadata_table.table.table_visualization
          vis.register_table_only = true
          vis.name = metadata_table.name

          vis.store
        rescue Sequel::DatabaseError => e
          raise unless e.message =~ /must be owner of relation/
        end
      end
    end

    def link_new_tables
      new_tables.each do |metadata_table|
        begin
          CartoDB.notify_debug('ghost tables', action: 'linking new table', new_table: metadata_table.name)

          table = Table.new

          table.user_id = @user.id
          table.name = metadata_table.name
          table.table_id = metadata_table.id
          table.register_table_only = true
          table.keep_user_database_table = true

          table.save
        rescue => e
          CartoDB.report_exception(e, 'Error linking new table', table_name: metadata_table.name,
                                                                 table_id: metadata_table.id)
        end
      end
    end

    def unlink_deleted_tables
      syncs = CartoDB::Synchronization::Collection.new.fetch(user_id: @user.id).map(&:name).compact

      # Remove tables with oids that don't exist on the db
      # Sync tables replace contents without touching metadata DB, so if method triggers meanwhile sync it will fail
      # TODO: Flag running syncs to distinguish between deleted table syncs and running syncs
      dropped_tables.select { |table| !syncs.include?(table.name) }.each do |linked_table|
        CartoDB.notify_debug('ghost tables', action: 'unlinking dropped table', dropped_table: linked_table.name)

        linked_table.table.keep_user_database_table = true
        linked_table.table.destroy
      end

      clean_user_tables_with_null_table_id
    end

    # Remove tables with null oids unless the table name exists on the db
    def clean_user_tables_with_null_table_id
      null_table_id_user_tables = linked_tables.select { |linked_table| linked_table.id.nil? }

      # Discard tables physically in database
      (null_table_id_user_tables - all_cartodbyfied_tables).each do |linked_table|
        t = Table.new(table_id: linked_table.id)

        t.keep_user_database_table = true
        t.destroy
      end
    end

    # this method searchs for tables with all the columns needed in a cartodb table.
    # it does not check column types, and only the latest cartodbfication trigger attached (test_quota_per_row)
    def search_for_cartodbfied_tables
      required_columns = Table::CARTODB_REQUIRED_COLUMNS + [Table::THE_GEOM_WEBMERCATOR]
      cartodb_columns = required_columns.map { |t| "'#{t}'" }.join(',')

      sql = %{
        WITH a as (
          SELECT table_name, count(column_name::text) cdb_columns_count
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
        SELECT table_name FROM a WHERE cdb_columns_count = #{required_columns.length}
      }

      @user.in_database(as: :superuser)[sql].all.map { |table| table[:table_name] }
    end

    # Tables viewable in the editor; in users user_tables
    def linked_tables
      @user.tables.select(:name, :table_id)
           .map { |table| Carto::MetadataTable.new(table.table_id, table.name, @user.id) }
    end

    # May not be viewed in the editor; only cartodbyfied
    def all_cartodbyfied_tables
      cartodbyfied_tables = search_for_cartodbfied_tables

      real_tables.select { |table| cartodbyfied_tables.include?(table[:relname]) }.compact
                 .map    { |table| Carto::MetadataTable.new(table[:oid], table[:relname], @user.id) }
    end

    # Not viewable in the editor
    def non_linked_tables
      all_cartodbyfied_tables - linked_tables
    end

    # Tables that have been dropped via API but have an old UserTable
    def dropped_tables
      (linked_tables - all_cartodbyfied_tables).select { |t| !renamed_tables.map(&:id).include?(t.id) }
    end

    # Tables that have been renamed through the SQL API
    def renamed_tables
      non_linked_tables.select { |metadata_table| !metadata_table.table.nil? }
    end

    # Tables that have been created trhought the SQL API
    def new_tables
      non_linked_tables.select { |metadata_table| metadata_table.table.nil? }
    end

    # Returns tables in pg_class for user
    def real_tables
      @user.in_database(as: :superuser)
           .select(:pg_class__oid, :pg_class__relname)
           .from(:pg_class)
           .join_table(:inner, :pg_namespace, oid: :relnamespace)
           .where(relkind: 'r', nspname: @user.database_schema)
           .exclude(relname: ::Table::SYSTEM_TABLE_NAMES)
           .all
    end
  end

  class MetadataTable
    attr_reader :id, :name, :user_id

    def initialize(id, name, user_id)
      @id = id
      @name = name
      @user_id = user_id
    end

    # Grabs the Table associated with this LinkedTable.
    def table
      user_tables = ::UserTable.where(table_id: id, user_id: user_id)

      first = user_tables.first

      if user_tables.count > 1
        CartoDB::Logger.warning(message: 'Duplicate UserTables detected', user: @user, table_name: first.name)
      end

      first ? Table.new(user_table: first) : nil
    end

    def eql?(other)
      @id.eql?(other.id) && @name.eql?(other.name) && @user_id.eql?(other.user_id)
    end

    def ==(other)
      eql?(other)
    end

    def hash
      [@id, @name, @user_id].hash
    end
  end
end
