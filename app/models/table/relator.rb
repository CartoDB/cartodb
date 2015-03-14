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
    }

    def initialize(db, table)
      @db     = db
      @table  = table
    end

    def table_visualization
      @table_visualization ||= Visualization::Collection.new.fetch(
        map_id: @table.user_table.map_id,
        type:   Visualization::Member::TYPE_CANONICAL
      ).first
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
      begin
        # Keep in sync with lib/sql/scripts-available/CDB_Quota.sql -> CDB_UserDataSize()
        size_calc = @table.is_raster? ? "pg_total_relation_size('\"' || ? || '\".\"' || relname || '\"')"
                                      : "pg_total_relation_size('\"' || ? || '\".\"' || relname || '\"') / 2"

        data = @table.owner.in_database.fetch(%Q{
              SELECT
                #{size_calc} AS size,
                reltuples::integer AS row_count
              FROM pg_class
              WHERE relname = ?
            },
            @table.owner.database_schema,
            @table.user_table.name
          ).first
      rescue => exception
        data = nil
        # INFO: we don't want code to fail because of SQL error
        CartoDB.notify_exception(exception)
      end
      data = { size: nil, row_count: nil } if data.nil?

      data
    end

    private

    attr_reader :db, :table

    def affected_visualization_records
      db[:visualizations].with_sql(%Q{
        SELECT  *
        FROM    layers_user_tables, layers_maps, visualizations
        WHERE   layers_user_tables.user_table_id = '#{table.user_table.id}'
        AND     layers_user_tables.layer_id = layers_maps.layer_id
        AND     layers_maps.map_id = visualizations.map_id
      })
    end

    def synchronization_record
      @syncronization_record ||= db[:synchronizations].with_sql(%Q{
        SELECT *
        FROM synchronizations
        WHERE synchronizations.user_id = '#{table.user_table.user_id}'
        AND synchronizations.name = '#{table.user_table.name}'
        LIMIT 1
      }).to_a
    rescue => exception
      puts exception.to_s
      puts exception.backtrace
      nil
    end

  end
end

