# Create/Drop/Rename overviews...

require_dependency 'carto/db/sql_interface'

module Carto
  class OverviewsService

    def initialize(database)
      @database = Carto::Db::SqlInterface.new(database)
    end

    def create_overviews(table_name, tolerance_px)
    end

    def rename_overviews(table_name, new_table_name)
      # TODO: use CDB_RenameOverviews
      overview_tables(table_name).each do |overview_table|
        new_overview_table = overview_table.sub(table_name, new_table_name)
        @database.run %{
          ALTER TABLE "#{overview_table}" RENAME TO "#{new_overview_table}"
        }
      end
    end

    def delete_overviews(table_name)
      if @database.fetch(%{SELECT cartodb._CDB_Table_Exists('#{table_name}')}).first[:_cdb_table_exists]
        @database.run(%{SELECT cartodb.CDB_DropOverviews('#{table_name}')})
      end
    end

    def overview_tables(table_name)
      overviews_data = @database.fetch(%{SELECT * FROM cartodb.CDB_Overviews('#{table_name}'::REGCLASS)})
      if overviews_data
        overviews_data.map { |row| row[:overview_table] }
      else
        []
      end
    rescue Carto::Db::SqlInterface::Error => e
      raise unless e.to_s.match /relation .does not exist/
      []
    end

  end
end
