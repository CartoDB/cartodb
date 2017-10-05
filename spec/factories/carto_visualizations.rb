require_relative '../support/factories/tables'

module Carto
  module Factories
    module Visualizations
      include CartoDB::Factories

      def full_visualization_table(carto_user, map)
        map_id = map.nil? ? nil : map.id
        Carto::UserTable.find(create_table(name: unique_name('fvt_table'), user_id: carto_user.id, map_id: map_id).id)
      end

      def create_full_builder_vis(carto_user, privacy: Carto::Visualization::PRIVACY_PUBLIC)
        create_full_visualization(carto_user, visualization_attributes: { version: 3, privacy: privacy })
      end

      # "Full visualization": with map, table... Including actual user table.
      # Table is bound to visualization, and to data_layer if it's not passed.
      def create_full_visualization(
        carto_user,
        canonical_map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id),
        map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id),
        table: full_visualization_table(carto_user, canonical_map),
        data_layer: nil,
        visualization_attributes: {}
      )

        table_visualization = table.visualization || create_table_visualization(carto_user, table)
        visualization = FactoryGirl.create(:carto_visualization, { user: carto_user, map: map }
                                   .merge(visualization_attributes))

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

      # A "full visualization" but from Builder, including a source analysis and a widget
      def create_builder_visualization(
        carto_user,
        canonical_map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id),
        map: FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id),
        table: full_visualization_table(carto_user, canonical_map),
        data_layer: nil,
        visualization_attributes: {}
      )

        map, table1, table_visualization, visualization = create_full_visualization(
          carto_user,
          canonical_map: canonical_map,
          map: map,
          table: table,
          data_layer: data_layer,
          visualization_attributes: visualization_attributes
        )

        source_id = 'a0'
        FactoryGirl.create(:simple_source_analysis,
                           natural_id: source_id, visualization: visualization, user: carto_user)

        data_layer = visualization.data_layers.first
        data_layer.options['source'] = source_id
        data_layer.save!

        widget = FactoryGirl.build(:widget, source_id: source_id, layer: data_layer, options: { valid: 'format' })

        return map, table1, table_visualization, visualization, visualization.analyses.first, widget
      end

      def create_table_visualization(carto_user, table)
        FactoryGirl.create(
          :carto_visualization, user: carto_user, type: 'table', name: table.name, map_id: table.map_id)
      end

      # Helper method for `create_full_visualization` results cleanup
      def destroy_full_visualization(map, table, table_visualization, visualization)
        table_visualization.destroy if table_visualization && Carto::Visualization.exists?(table_visualization.id)
        table.service.destroy if table && table.service && Carto::UserTable.exists?(table.id)
        table.destroy if table && Carto::UserTable.exists?(table.id)
        visualization.destroy if visualization && Carto::Visualization.exists?(visualization.id)
        map.destroy if map && Carto::Map.exists?(map.id)
      end

      def destroy_visualization(visualization_id)
        member = CartoDB::Visualization::Member.new(id: visualization_id).fetch
        member.delete
      end
    end
  end
end
