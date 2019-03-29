# encoding: utf-8
require_relative '../visualization/collection'
require_relative '../visualization/member'

module CartoDB
  class TableRelator
    INTERFACE = %w{
      synchronization
      row_count_and_size
      related_templates
    }

    def initialize(db, table)
      @db     = db
      @table  = table
    end

    def dependent_visualizations
      affected_visualizations.select { |v| v.dependent_on?(table) }
    end

    def affected_visualizations
      affected_visualization_records.to_a
        .uniq { |attributes| attributes.fetch(:id) }
        .map  { |attributes| Visualization::Member.new(attributes) }
    end

    def preview_for(visualization)
      data = {
        id:         visualization.id,
        name:       visualization.name,
        updated_at: visualization.updated_at
      }
      if visualization[:permission_id].present? && !visualization.permission.nil?
        data[:permission] = CartoDB::PermissionPresenter.new(visualization.permission).to_poro.select do |key, _val|
          [:id, :owner].include?(key)
        end
      end
      data[:auth_tokens] = if visualization.password_protected?
                             visualization.get_auth_tokens
                           elsif visualization.is_privacy_private?
                             visualization.user.get_auth_tokens
                           else
                             []
                           end
      data
    end

    def synchronization
      return nil unless synchronization_record && !synchronization_record.empty?
      CartoDB::Synchronization::Member.new(synchronization_record.first)
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
