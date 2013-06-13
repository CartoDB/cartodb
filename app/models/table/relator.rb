# encoding: utf-8
require_relative '../visualization/collection'

module CartoDB
  module Table
    class Relator
      INTERFACE = %w{
        table_visualization
        serialize_dependent_visualizations
        serialize_non_dependent_visualizations
        dependent_visualizations
        non_dependent_visualizations
        affected_visualizations
      }

      def initialize(db, table)
        @db     = db
        @table  = table
      end #initialize

      def table_visualization
        @table_visualization ||= CartoDB::Visualization::Collection.new.fetch(
          map_id: [table.map_id],
          type:   'table'
        ).first
      end #table_visualization

      def serialize_dependent_visualizations
        dependent_visualizations.map { |visualization|
          { id: visualization.id, name: visualization.name }
        }
      end #serialize_dependent_visualizations

      def serialize_non_dependent_visualizations
        non_dependent_visualizations.map { |visualization|
          { id: visualization.id, name: visualization.name }
        }
      end #serialize_non_dependent_visualizations

      def dependent_visualizations
        affected_visualizations.select do |visualization|
          visualization.layers(:cartodb).to_a.length == 1
        end
      end #dependent_visualizations

      def non_dependent_visualizations
        affected_visualizations.select do |visualization|
          visualization.layers(:cartodb).to_a.length > 1
        end
      end #non_dependent_visualizations

      def affected_visualizations
        @affected_visualizations ||
          affected_visualization_records.map do |attributes|
            CartoDB::Visualization::Member.new(attributes)
          end
      end #affected_visualizations

      private

      attr_reader :db, :table

      def affected_visualization_records
        db[:visualizations].with_sql(%Q{
          SELECT  visualizations.id, visualizations.name, visualizations.map_id
          FROM    layers_user_tables, layers_maps, visualizations
          WHERE   layers_user_tables.user_table_id = #{table.id}
          AND     layers_user_tables.layer_id = layers_maps.layer_id
          AND     layers_maps.map_id = visualizations.map_id
        })
      end #affected_visualization_records
    end # Relator
  end # Table
end # CartoDB

      #def serialize_affected_visualizations
      #  affected_visualization_records.select(:id, :name).map(&:to_hash)
      #end #serialize_affected_visualizations
