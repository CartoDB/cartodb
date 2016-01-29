# encoding: utf-8

module CartoDB
  module Importer2
    # Overview creation
    #
    # Pending issues: metrics, quotas/limits, timing, logging, ...
    #
    class Overviews

      DEFAULT_MIN_ROWS = 1000000

      def initialize(runner, user, options = {})
        @runner = runner
        @user = user
        @schema = user.database_schema
        @database = user.in_database
        @min_rows = options[:min_rows] ||
                    Cartodb.get_config(:overviews, 'min_rows') ||
                    DEFAULT_MIN_ROWS
      end

      def required?(table)
        # TODO: check quotas, etc...
        table_row_count(table) >= @min_rows
      end

      def create!(table)
        table_name = table_name_with_schema(@schema, table)
        @runner.log.append("Will create overviews for #{table_name}")
        # TODO: timing, exception handling, ...

        @database.run %{
          SELECT cartodb.CDB_CreateOverviews('#{table_name}'::REGCLASS);
        }

        @runner.log.append("Overviews created for #{table_name}")
      end

      private

      def table_row_count(table)
        UserTable.find_by_identifier(@user.id, table).service.rows_estimated(@user)
      end

      def table_name_with_schema(schema, table)
        # TODO: quote if necessary
        "#{schema}.#{table}"
      end
    end
  end
end
