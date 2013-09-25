# encoding: utf-8
require_relative '../../services/importer/lib/importer'

module CartoDB
  module Connector
    class Importer
      DEFAULT_SCHEMA = 'cdb_importer'

      attr_accessor :table

      def initialize(user, data_source, pg_options, log, table_klass)
        @user         = user
        @data_source  = data_source
        @pg_options   = pg_options
        @log          = log
        @table_klass  = table_klass
      end

      def run(tracker)
        runner.run(&tracker)

        if table_quota_exceeded?
          drop(results)
        else
          results.select(&:success?).each { |result| register(result) }
        end

        self
      end

      def success?
        return false if table_quota_exceeded?
        runner.success?
      end

      def drop_all(results)
        results.each { |result| drop(result) }
      end

      def drop(result)
        statement = %Q{DROP TABLE #{result.qualified_table_name}}
        user.in_database.execute(statement)
      rescue
        self
      end

      def register(result)
        move_to_schema(result, 'public')
        rename(result)
      end

      def move_to_schema(result, schema=DEFAULT_SCHEMA)
        return self if schema == result.schema
        user.in_database(as: :superuser).execute(%Q{
          ALTER TABLE "#{result.schema}"."#{result.table_name}"
          SET SCHEMA public
        })
      end

      def rename(result, rename_attempts=0)
        rename_attempts = rename_attempts + 1
        name            = name_candidate(result.name)

        user.in_database.execute(%Q{
          ALTER TABLE "public"."#{result.table_name}"
          RENAME TO "#{name}"
        })
        persist_metadata(name)
      rescue => exception
        retry unless rename_attempts > 1
      end

      def name_candidate(table_name)
        table_klass.get_valid_table_name(
          table_name, name_candidates: user.reload.tables.map(&:name)
        )
      end

      def table_quota_exceeded?
        return false unless user.remaining_table_quota
        results.length > user.remaining_table_quota.to_i
      end

      def persist_metadata(name)
        table                         = table_klass.new
        table.user_id                 = user.id
        table.name                    = name
        table.migrate_existing_table  = name
        table.save
        table.optimize
        table.map.recalculate_bounds!

        self.table = table
        self
      end

      def results
        runner.results
      end 

      def error_code
        return 8002 if table_quota_exceeded?
        results.map(&:error_code).compact.first
      end #errors_from

      private

      attr_reader :user, :data_source, :pg_options, :log, :table_klass

      def downloader
        @downloader ||= Importer2::Downloader.new(data_source)
      end

      def runner
        @runner ||= Importer2::Runner
          .new(pg_options, downloader, log, user.remaining_quota)
      end
    end # Importer
  end # Connector
end # CartoDB

