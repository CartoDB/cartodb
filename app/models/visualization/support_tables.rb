# encoding: utf-8

require_relative './member'

module CartoDB
  module Visualization
    class SupportTables

      def initialize(database_connection, parent=nil)
        @database = database_connection
        @parent = parent

        @tables_list = nil
      end

      # Only intended to be used if from the Visualization Relator (who will set the parent)
      def load_actual_list
        return [] if @parent.nil? || @parent.kind != Visualization::Member::KIND_RASTER
        table_data = @database.fetch(%Q{
          SELECT o_table_schema AS schema, o_table_name AS name
          FROM raster_overviews
          WHERE r_table_schema = '#{@parent.user.database_schema}' AND r_table_name = '#{@parent.name}'
        }).all

        table_data.nil? ? [] : table_data
      end

      def delete_all
        tables.each { |table|
          @database.execute(%Q{
            DROP TABLE "#{table[:schema]}"."#{table[:name]}"
          })
        }
      end

      def rename(existing_parent_name, new_parent_name)
        begin
          support_tables_new_names = []
          tables.each { |item|
            new_support_table_name = item[:name].dup
            # CONVENTION: support_tables will always end in "_tablename", so we substitute using parent name
            new_support_table_name.slice!(-existing_parent_name.length, existing_parent_name.length)
            new_support_table_name = "#{new_support_table_name}#{new_parent_name}"

            @database.execute(%Q{
              ALTER TABLE "#{item[:schema]}"."#{item[:name]}" RENAME TO "#{new_support_table_name}"
            })

            support_tables_new_names.push(new_support_table_name)
          }
          renamed = true
        rescue
          renamed = false
        end

        { success: renamed, names: support_tables_new_names }
      end

      def change_schema(new_schema, parent_table_name)
        tables.each { |item|
          @database.execute(%Q{
            ALTER TABLE "#{item[:schema]}"."#{item[:name]}"
            SET SCHEMA "#{new_schema}"
          })
          # Constraints are not automatically updated upon schema change or table renaming
          recreate_raster_constraints_if_exists(item[:name], parent_table_name, new_schema)
        }
      end

      # For import purposes
      # @param new_list Array [ { :schema, :name } ]
      def tables=(new_list)
        @tables_list = new_list
      end

      private

      def tables
        @tables_list ||= load_actual_list
      end

      # @see http://postgis.net/docs/manual-dev/using_raster_dataman.html#RT_Raster_Overviews
      def recreate_raster_constraints_if_exists(overview_table_name, raster_table_name, new_schema)
        constraint = @database.fetch(%Q{
          SELECT o_table_name, o_raster_column, r_table_name, r_raster_column, overview_factor
          FROM raster_overviews WHERE o_table_name = '#{overview_table_name}'
        }).first
        return if constraint.nil?

        @database.transaction do
          # @see http://postgis.net/docs/RT_DropOverviewConstraints.html
          @database.execute(%Q{
            SELECT DropOverviewConstraints('#{new_schema}', '#{constraint[:o_table_name]}',
                                           '#{constraint[:o_raster_column]}')
          })
          # @see http://postgis.net/docs/manual-dev/RT_AddOverviewConstraints.html
          @database.execute(%Q{
            SELECT AddOverviewConstraints('#{new_schema}', '#{constraint[:o_table_name]}',
                                          '#{constraint[:o_raster_column]}', '#{new_schema}', '#{raster_table_name}',
                                          '#{constraint[:r_raster_column]}', #{constraint[:overview_factor]});
          })
        end
      end

    end
  end
end