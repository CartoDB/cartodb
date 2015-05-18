require 'active_record'

module Carto

  class UserTable < ActiveRecord::Base

    PRIVACY_PRIVATE = 0
    PRIVACY_PUBLIC = 1
    PRIVACY_LINK = 2

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

    def name_for_user(other_user)
      is_owner?(other_user) ? name : fully_qualified_name
    end

    def private?
      self.privacy == PRIVACY_PRIVATE
    end

    def public?
      self.privacy == PRIVACY_PUBLIC
    end

    def public_with_link_only?
      self.privacy == PRIVACY_LINK
    end

    private

    def fully_qualified_name
      "#{user.database_schema}.#{name}"
    end

    def is_owner?(user)
      return false unless user
      user_id == user.id
    end

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
