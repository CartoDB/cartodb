require 'active_record'

module Carto

  class UserTable < ActiveRecord::Base

    belongs_to :visualization, primary_key: :map_id, foreign_key: :map_id, 
                conditions: { type: Carto::Visualization::TYPE_CANONICAL }, inverse_of: :user_table

    belongs_to :user

    belongs_to :map

    def geometry_types
      @geometry_types ||= table.geometry_types
    end

    def size
      row_count_and_size[:size]
    end

    def row_count
      row_count_and_size[:row_count]
    end

    def row_count_and_size
      @row_count_and_size ||= table.row_count_and_size
    end

    def service
      @service ||= ::Table.new(user_table: self)
    end

    def set_service(table)
      @table = table
    end

    def synchronization
      # TODO: replace with an association so it can be joined and eager loaded
      @synchronization ||= get_synchronization
    end

    def dependent_visualizations
      affected_visualizations.select(&:dependent?)
    end

    def non_dependent_visualizations
      affected_visualizations.select(&:non_dependent?)
    end

    private

    def affected_visualizations
      affected_visualizations ||= affected_visualization_ids
        .map  { |id| Carto::Visualization.find(id) }
    end

    # TODO: use associations?
    def affected_visualization_ids
      ActiveRecord::Base.connection.execute(%Q{
        SELECT  distinct visualizations.id
        FROM    layers_user_tables, layers_maps, visualizations
        WHERE   layers_user_tables.user_table_id = '#{table.id}'
        AND     layers_user_tables.layer_id = layers_maps.layer_id
        AND     layers_maps.map_id = visualizations.map_id
      }).map { |row| row['id'] }
    end

    def table
      @table ||= ::Table.new( { user_table: self } )
    end

    def get_synchronization
      Carto::Synchronization.where(user_id: user_id, name: name).first
    end

  end

end
