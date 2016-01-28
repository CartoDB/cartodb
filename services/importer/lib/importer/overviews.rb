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
        @database = options[:database] || user.in_database
        @min_rows = options[:min_rows] ||
                    Cartodb.get_config(:overviews, 'min_rows') ||
                    DEFAULT_MIN_ROWS
      end

      def required?(table, options = {})
        schema = schema_from_options(options)
        # TODO: check quotas, etc...
        table_row_count(schema, table) >= @min_rows
      end

      def create!(table, options = {})
        schema = schema_from_options(options)
        table_name = table_name_with_schema(schema, table)
        @runner.log.append("Will create overviews for #{table_name}")
        # TODO: timing, exception handling, ...

        @database.run %{
          SELECT cartodb.CDB_CreateOverviews('#{table_name}'::REGCLASS);
        }
        @runner.log.append("Overviews created for #{table_name}")
      end

      private

      def table_row_count(schema, table)
        # TODO: TableRowCount is not intended to be used like this
        # (to compute the table row count; method `get` is protected)
        # could have a class (derived from TableRowCount for implementation)
        # with this purpose
        table_row_count = CartoDB::PlatformLimits::Importer::TableRowCount.new(
          user: @user,
          db: @database
        )
        table_row_count.send(:get, table_name: table, tables_schema: schema)
      end

      def schema_from_options(options = {})
        options[:schema] || @user.database_schema
      end

      def table_name_with_schema(schema, table)
        # TODO: quote if necessary
        "#{schema}.#{table}"
      end

    end
  end
end
