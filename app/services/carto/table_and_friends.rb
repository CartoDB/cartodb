module Carto
  # A dataset may be comprised of additional tables other than the main table
  # This is a utility to apply changes (e.g. privilege modifications) to all
  # the tables than comprise the dataset.
  module TableAndFriends
    def self.apply(db_connection, schema, table_name, &block)
      block[schema, table_name]
      # TODO: should we apply also to raster overview tables?
      # To do so we could use SupportTables class and modify it to make #tables public.
      # Note that SupportTables handles only raster overviews and provides methods
      # to rename them, delete them and change their schema.
    end
  end
end
