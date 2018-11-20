module Carto
  # A dataset may be comprised of additional tables other than the main table
  # For example, if overviews have been created for the dataset.
  # This is a utility to apply changes (e.g. privilege modifications) to all
  # the tables than comprise the dataset.
  module TableAndFriends
    def self.apply(db_connection, schema, table_name, &block)
      qualified_name = qualified_table_name(schema, table_name)
      block[schema, table_name, qualified_name]
      overviews_service = Carto::OverviewsService.new(db_connection)
      overviews_service.overview_tables(qualified_name).each do |overview_table|
        table, _ = Table.table_and_schema(overview_table)
        block[schema, table, qualified_table_name(schema, table)]
      end
      # TODO: should we apply also to raster overview tables?
      # To do so we could use SupportTables class and modify it to make #tables public.
      # Note that SupportTables handles only raster overviews and provides methods
      # to rename them, delete them and change their schema.
    end

    def self.qualified_table_name(schema, table_name)
      %{"#{schema.gsub('"', '""')}"."#{table_name.gsub('"', '""')}"}
    end
  end
end
