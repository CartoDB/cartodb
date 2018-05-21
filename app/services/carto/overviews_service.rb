# Create/Drop/Rename overviews...

require_dependency 'carto/db/sql_interface'

module Carto
  class OverviewsService

    def initialize(database)
      @database = Carto::Db::SqlInterface.new(database)
    end

    def create_overviews(table_name, tolerance_px)
      @database.run %{
        SELECT cartodb.CDB_CreateOverviewsWithToleranceInPixels('#{table_name}'::REGCLASS, '#{tolerance_px}'::float8);
      }
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
      # TODO: this is not very elegant, we could detect the existence of the
      # table some otherway or have a CDB_DropOverviews(text)  function...
      @database.run(%{SELECT cartodb.CDB_DropOverviews('#{table_name}'::REGCLASS)})
    rescue Carto::Db::SqlInterface::Error => e
      raise unless e.to_s.match /relation .+ does not exist/
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
