# encoding: utf-8
require_relative '../visualization/collection'
require_relative '../visualization/member'

module CartoDB
  class TableRelator
    INTERFACE = %w{
      table_visualization
      serialize_dependent_visualizations
      serialize_non_dependent_visualizations
      dependent_visualizations
      non_dependent_visualizations
      affected_visualizations
      synchronization
      serialize_synchronization
      row_count_and_size
      set_table_visualization
    }

    def initialize(db, table)
      @db     = db
      @table  = table
    end

    def table_visualization
      @table_visualization ||= Visualization::Collection.new.fetch(
        map_id: @table.map_id,
        type:   Visualization::Member::TYPE_CANONICAL
      ).first
    end

    # INFO: avoids doble viz fetching when table is itself generated from viz
    def set_table_visualization(table_visualization)
      @table_visualization = table_visualization
    end

    def serialize_dependent_visualizations
      dependent_visualizations.map { |object| preview_for(object) }
    end

    def serialize_non_dependent_visualizations
      non_dependent_visualizations.map { |object| preview_for(object) }
    end

    def dependent_visualizations
      affected_visualizations.select(&:dependent?)
    end

    def non_dependent_visualizations
      affected_visualizations.select(&:non_dependent?)
    end

    def affected_visualizations
      affected_visualization_records.to_a
        .uniq { |attributes| attributes.fetch(:id) }
        .map  { |attributes| Visualization::Member.new(attributes) }
    end

    def preview_for(object)
      data = {
        id:         object.id,
        name:       object.name,
        updated_at: object.updated_at
      }
      if object[:permission_id].present? && !object.permission.nil?
        data[:permission] = object.permission.to_poro.select {|key, val|
          [:id, :owner].include?(key)
        }
      end
      data
    end

    def synchronization
      return nil unless synchronization_record && !synchronization_record.empty?
      CartoDB::Synchronization::Member.new(synchronization_record.first)
    end

    def serialize_synchronization
      (synchronization || {}).to_hash
    end

    def row_count_and_size
      @table.row_count_and_size
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
    end

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

  end
end

