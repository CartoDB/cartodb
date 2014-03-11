# encoding: utf-8
require_relative '../visualization/collection'
require_relative '../visualization/member'

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
        synchronization
        serialize_synchronization
      }

      def initialize(db, table)
        @db     = db
        @table  = table
      end #initialize

      def table_visualization
        @table_visualization ||= Visualization::Collection.new.fetch(
          map_id: table.map_id,
          type:   'table'
        ).first
      end #table_visualization

      def serialize_dependent_visualizations
        dependent_visualizations.map { |object| preview_for(object) }
      end #serialize_dependent_visualizations

      def serialize_non_dependent_visualizations
        non_dependent_visualizations.map { |object| preview_for(object) }
      end #serialize_non_dependent_visualizations

      def dependent_visualizations
        affected_visualizations.select(&:dependent?)
      end #dependent_visualizations

      def non_dependent_visualizations
        affected_visualizations.select(&:non_dependent?)
      end #non_dependent_visualizations

      def affected_visualizations
        affected_visualization_records.to_a
          .uniq { |attributes| attributes.fetch(:id) }
          .map  { |attributes| Visualization::Member.new(attributes) }
      end #affected_visualizations

      def preview_for(object)
        { id: object.id, name: object.name }
      end #preview_for

      def synchronization
        return nil unless synchronization_record && !synchronization_record.empty?
        CartoDB::Synchronization::Member.new(synchronization_record.first)
      end

      def serialize_synchronization
        (synchronization || {}).to_hash
      end

      private

      attr_reader :db, :table

      def affected_visualization_records
        db[:visualizations].with_sql(%Q{
          SELECT  *
          FROM    layers_user_tables, layers_maps, visualizations
          WHERE   layers_user_tables.user_table_id = '#{table.id}'
          AND     layers_user_tables.layer_id = layers_maps.layer_id
          AND     layers_maps.map_id = visualizations.map_id
        })
      end #affected_visualization_records

      def synchronization_record
        @syncronization_record ||= db[:synchronizations].with_sql(%Q{
          SELECT *
          FROM synchronizations
          WHERE synchronizations.user_id = '#{table.user_id}'
          AND synchronizations.name = '#{table.name}'
          LIMIT 1
        }).to_a
      rescue => exception
        puts exception.to_s
        puts exception.backtrace
        nil
      end

    end # Relator
  end # Table
end # CartoDB

