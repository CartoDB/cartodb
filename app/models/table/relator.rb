# encoding: utf-8
require_relative '../visualization/collection'
require_relative '../visualization/member'

module CartoDB
  class TableRelator
    INTERFACE = %w{
      serialize_fully_dependent_visualizations
      serialize_partially_dependent_visualizations
      synchronization
      serialize_synchronization
      row_count_and_size
      related_templates
    }

    def initialize(db, table)
      @db     = db
      @table  = table
    end

    def serialize_fully_dependent_visualizations
      table.fully_dependent_visualizations.map { |object| preview_for(object) }
    end

    def serialize_partially_dependent_visualizations
      table.partially_dependent_visualizations.map { |object| preview_for(object) }
    end

    def dependent_visualizations
      affected_visualizations.select { |v| v.dependent_on?(table) }
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

    def related_templates
      Carto::Template.all.select { |template| template.relates_to_table?(@table) }
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
