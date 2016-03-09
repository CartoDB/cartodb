# encoding utf-8

module Carto
  class GhostTablesManager
    MUTEX_REDIS_KEY = 'ghost_tables_working'
    MUTEX_TTL = 2000

    def link(user)
      bolt = Redlock::Client.new(["redis://#{Cartodb.config[:redis]['host']}:#{Cartodb.config[:redis]['port']}"])

      bolt.lock(mutex_redis_key(user), MUTEX_TTL) do |locked|
        next unless locked

        # Lock aquired, inside the critical zone
        no_tables = user.real_tables.blank?

        link_renamed_tables(user) unless no_tables
        link_deleted_tables(user)
        link_created_tables(user) unless no_tables
        # Leaving the critical zone, bolt unlocked automatically
      end
    end

    # search in the user database for tables that are not in the metadata database
    def self.has_renamed_tables?(user)
      metadata_table_names = user.tables.select(:name).map(&:name)
      real_names = user.real_tables.map { |table| table[:relname] }

      return metadata_table_names.to_set != real_names.to_set
    end

    protected

    def mutex_redis_key(user)
      "rails:users:#{user.username}:#{MUTEX_REDIS_KEY}"
    end

    def link_renamed_tables(user)
      metadata_tables_ids = user.tables.select(:table_id).map(&:table_id)
      metadata_table_names = user.tables.select(:name).map(&:name)
      renamed_tables = user.real_tables.reject{ |t| metadata_table_names.include?(t[:relname]) }.select{|t| metadata_tables_ids.include?(t[:oid])}
      renamed_tables.each do |t|
        table = Table.new(user_table: ::UserTable.find(table_id: t[:oid], user_id: user.id))
        begin
          Rollbar.report_message('ghost tables', 'debug', {
            action: 'rename',
            new_table: t[:relname]
          })
          vis = t.table_visualization
          vis.register_table_only = true
          vis.name = t[:relname]
          vis.store
        rescue Sequel::DatabaseError => e
          raise unless e.message =~ /must be owner of relation/
        end
      end
    end

    def link_deleted_tables(user)
      # Sync tables replace contents without touching metadata DB, so if method triggers meanwhile sync will fail
      syncs = CartoDB::Synchronization::Collection.new.fetch(user_id: user.id).map(&:name).compact

      # Avoid fetching full models
      metadata_tables = user.tables.select(:table_id, :name).map do |table|
        { table_id: table.table_id, name: table.name }
      end

      metadata_tables_ids = metadata_tables.select{ |table| !syncs.include?(table[:name]) }.map do |table|
        table[:table_id]
      end

      dropped_tables = metadata_tables_ids - user.real_tables.map{ |table| table[:oid] }.compact

      # Remove tables with oids that don't exist on the db
      user.tables.where(table_id: dropped_tables).all.each do |user_table|
        Rollbar.report_message('ghost tables', 'debug', { action: 'dropping table', new_table: user_table.name })

        table = Table.new(user_table: user_table)
        table.keep_user_database_table = true
        table.destroy
      end if dropped_tables.present?

      # Remove tables with null oids unless the table name exists on the db
      user.tables.filter(table_id: nil).all.each do |user_table|
        t = Table.new(user_table: user_table)
        t.keep_user_database_table = true
        t.destroy unless user.real_tables.map { |table| table[:relname] }.include?(t.name)
      end if dropped_tables.present? && dropped_tables.include?(nil)
    end

    def link_created_tables(user)
      table_names = search_for_cartodbfied_tables(user)
      created_tables = user.real_tables.select { |table| table_names.include?(table[:relname]) }

      created_tables.each do |t|
        begin
          Rollbar.report_message('ghost tables', 'debug', { action: 'registering table', new_table: t[:relname] })

          table = Table.new

          table.user_id = user.id
          table.name = t[:relname]
          table.table_id = t[:oid]
          table.register_table_only = true
          table.keep_user_database_table = true

          table.save
        rescue => e
          puts e
        end
      end
    end

    # this method searchs for tables with all the columns needed in a cartodb table.
    # it does not check column types, and only the latest cartodbfication trigger attached (test_quota_per_row)
    # returns the list of tables in the database with those columns but not in metadata database
    def search_for_cartodbfied_tables(user)
      metadata_table_names = user.tables.select(:name).map(&:name).map { |table| "'#{table}'" }.join(',')

      db = user.in_database(as: :superuser)

      required_columns = Table::CARTODB_REQUIRED_COLUMNS + [Table::THE_GEOM_WEBMERCATOR]
      cartodb_columns = (required_columns).map { |t| "'#{t.to_s}'" }.join(',')
      sql = %Q{
        WITH a as (
          SELECT table_name, count(column_name::text) cdb_columns_count
          FROM information_schema.columns c, pg_tables t, pg_trigger tg
          WHERE
            t.tablename = c.table_name AND
            t.schemaname = c.table_schema AND
            c.table_schema = '#{user.database_schema}' AND
            t.tableowner = '#{user.database_username}' AND
      }

      if metadata_table_names.length != 0
        sql += %Q{
          c.table_name NOT IN (#{metadata_table_names}) AND
        }
      end

      sql += %Q{
            column_name IN (#{cartodb_columns}) AND

            tg.tgrelid = (quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass::oid AND
            tg.tgname = 'test_quota_per_row'

            GROUP BY 1
        )
        SELECT table_name FROM a WHERE cdb_columns_count = #{required_columns.length}
      }

      db[sql].all.map { |table| table[:table_name] }
    end
  end
end
