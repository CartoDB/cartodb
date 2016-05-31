module Carto
  module Factories
    module Visualizations
      def full_visualization_table(carto_user, map)
        FactoryGirl.create(
          :carto_user_table,
          user_id: carto_user.id,
          map_id: map.id,
          privacy: Carto::UserTable::PRIVACY_PUBLIC
        )
      end

      # "Full visualization": with map, table... Metadata only (not actual user table).
      # Table is bound to visualization, and to data_layer if it's not passed.
      def create_full_visualization(
        carto_user,
        map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id),
        table: full_visualization_table(carto_user, map),
        data_layer: nil)

        # table_visualization = FactoryGirl.create(
        #   :carto_visualization,
        #   user: carto_user, type: 'table', name: table.name, map_id: table.map_id)
        table_visualization = table.visualization
        visualization = FactoryGirl.create(:carto_visualization, user_id: carto_user.id, map: map)

        unless data_layer.present?
          data_layer = visualization.map.data_layers.first
          data_layer.options[:table_name] = table.name
          data_layer.options[:query] = "select * from #{table.name}"
          data_layer.options[:sql_wrap] = "select * from (<%= sql %>) __wrap"
          data_layer.save
        end

        visualization.update_column(:active_layer_id, visualization.layers.first.id)

        FactoryGirl.create(:carto_zoom_overlay, visualization: visualization)
        FactoryGirl.create(:carto_search_overlay, visualization: visualization)

        # Need to mock the nonexistant table because factories use Carto::* models
        CartoDB::Visualization::Member.any_instance.stubs(:propagate_name_to).returns(true)
        CartoDB::Visualization::Member.any_instance.stubs(:propagate_privacy_to).returns(true)

        visualization.reload

        return map, table, table_visualization, visualization
      end

      # Helper method for `create_full_visualization` results cleanup
      def destroy_full_visualization(map, table, table_visualization, visualization)
        table_visualization.destroy if table_visualization
        table.destroy if table
        visualization.destroy if visualization
        map.destroy if map
      end
    end
  end
end
