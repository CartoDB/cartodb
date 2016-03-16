# encoding utf-8

module Carto
  class GhostTablesManager
    MUTEX_REDIS_KEY = 'ghost_tables_working'.freeze
    MUTEX_TTL_MS = 2000

    def initialize(user_id)
      @user = ::User.where(id: user_id).first
    end

    def link
      bolt = Redlock::Client.new(["redis://#{Cartodb.config[:redis]['host']}:#{Cartodb.config[:redis]['port']}"])

      bolt.lock(mutex_redis_key, MUTEX_TTL_MS) do |locked|
        next unless locked

        # Lock aquired, inside the critical zone

        # NOTE: Order DOES matter, FIRST renamed, THEN new and deleted LAST
        unless all_tables.blank?
          relink_renamed_tables
          link_new_tables
        end

        unlink_deleted_tables
      end

      # Left the critical zone, bolt automatically unlocked
    end

    # determine linked tables vs cartodbfied tables consistency; i.e.: needs to run link
    def consistent?
      non_linked_tables.empty? && stale_tables.empty?
    end

    # checks if sql-api deleted/renamed tables that are still linked
    def has_stale_linked_tables?
      !stale_tables.empty?
    end

    protected

    def mutex_redis_key
      "rails:users:#{@user.username}:#{MUTEX_REDIS_KEY}"
    end

    def relink_renamed_tables
      non_linked_tables.each do |t|
        table = fetch_table_for_user_table(t[:id])

        next if table.nil? # UserTable hasn't been created yet; take care of it in link_new_tables

        begin
          CartoDB.notify_debug('ghost tables', action: 'link renamed', renamed_table: t[:relname])

          vis = table.table_visualization
          vis.register_table_only = true
          vis.name = t[:name]

          vis.store
        rescue Sequel::DatabaseError => e
          raise unless e.message =~ /must be owner of relation/
        end
      end
    end

    def link_new_tables
      non_linked_tables.each do |t|
        begin
          CartoDB.notify_debug('ghost tables', action: 'registering table', new_table: t[:name])

          table = Table.new

          table.user_id = @user.id
          table.name = t[:name]
          table.table_id = t[:id]
          table.register_table_only = true
          table.keep_user_database_table = true

          table.save
        rescue => e
          puts e
        end
      end
    end

    def unlink_deleted_tables
      syncs = CartoDB::Synchronization::Collection.new.fetch(user_id: @user.id).map(&:name).compact

      # Remove tables with oids that don't exist on the db
      stale_tables.each do |user_table|
        # Sync tables replace contents without touching metadata DB, so if method triggers meanwhile sync it will fail
        # TODO: Flag running syncs to distinguish between deleted table syncs and running syncs
        next if syncs.include?(user_table[:name])

        table = fetch_table_for_user_table(user_table[:id])

        next if table.nil? # TODO: Report this if buggy.

        CartoDB.notify_debug('ghost tables', action: 'dropping table', dropped_table: user_table[:name])

        table.keep_user_database_table = true
        table.destroy
      end

      clean_user_tables_with_null_table_id
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
      @user.tables.select(:name, :table_id).map { |table| { id: table.table_id, name: table.name } }
    end

    # May not be viewed in the editor; carotdbyfied_only
    def all_tables
      real_tables.select { |table| search_for_cartodbfied_tables.include?(table[:relname]) }
                 .map    { |table| { id: table[:oid], name: table[:relname] } }
                 .compact
    end

    # Not viewable in the editor
    def non_linked_tables
      all_tables - linked_tables
    end

    # Tables that have been dropped via API but still exist as UserTable
    def stale_tables
      linked_tables - all_tables
    end

    # Remove tables with null oids unless the table name exists on the db
    def clean_user_tables_with_null_table_id
      null_table_id_user_tables = linked_tables.select { |linked_table| linked_table[:id].nil? }

      # Discard tables physically in database
      (null_table_id_user_tables - all_tables).each do |user_table|
        t = Table.new(table_id: user_table[:id])

        t.keep_user_database_table = true
        t.destroy
      end
    end

    # Grabs the Table associated with a UserTable identified by its table_id. Also reports duplicate UserTables.
    def fetch_table_for_user_table(table_id)
      user_tables = ::UserTable.where(table_id: table_id, user_id: @user.id)

      if user_tables.count > 1
        CartoDB.notify_error("#{@user.username} has duplicate UserTables", duplicated_table_id: table_id)
      end

      user_tables.first ? Table.new(user_table: user_tables.first) : nil
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
end
