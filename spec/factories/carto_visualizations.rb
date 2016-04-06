module Carto
  module Factories
    module Visualizations
      # "Full visualization": with map, table... Metadata only (not actual user table).
      def create_full_visualization(carto_user, map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id))
        table = FactoryGirl.create(:carto_user_table, user_id: carto_user.id, map_id: map.id)
        table_visualization = FactoryGirl.create(
          :carto_visualization,
          user: carto_user, type: 'table', name: table.name, map_id: table.map_id,
          permission_id: create_permission_for_user(carto_user).id)
        visualization = FactoryGirl.create(
          :carto_visualization,
          user_id: carto_user.id,
          map: map,
          permission_id: create_permission_for_user(carto_user).id)
        # Need to mock the nonexistant table because factories use Carto::* models
        CartoDB::Visualization::Member.any_instance.stubs(:propagate_name_to).returns(true)
        CartoDB::Visualization::Member.any_instance.stubs(:propagate_privacy_to).returns(true)

        return map, table, table_visualization, visualization
      end

      # Helper method for `create_full_visualization` results cleanup
      def destroy_full_visualization(map, table, table_visualization, visualization)
        table_visualization.permission.destroy if table_visualization && table_visualization.permission
        table_visualization.destroy if table_visualization
        table.destroy if table
        visualization.permission.destroy if visualization && visualization.permission
        visualization.destroy if visualization
        map.destroy if map
      end

      def create_permission_for_user(carto_user)
        Carto::Permission.create(owner_id: carto_user.id, owner_username: carto_user.username)
      end
    end
  end
end
