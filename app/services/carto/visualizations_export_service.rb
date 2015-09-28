# encoding: utf-8

require_relative "../../controllers/carto/api/visualization_vizjson_adapter"

module Carto
  class VisualizationsExportService

    SERVICE_VERSION = 1


    def export(visualization_id)
      visualization = Carto::Visualization.where(id: visualization_id).first
      raise "Visualization with id #{visualization_id} not found" unless visualization

      vizjson_options = {
        full: true,
        user_name: visualization.user.username,
        user_api_key: visualization.user.api_key,
        user: visualization.user,
        viewer_user: visualization.user,
        export: true
      }

      data = CartoDB::Visualization::VizJSON.new(
        Carto::Api::VisualizationVizJSONAdapter.new(visualization, $tables_metadata), vizjson_options, Cartodb.config)
                                            .to_export_poro(SERVICE_VERSION)
                                            .to_json

      backup_entry = Carto::VisualizationBackup.new(
        username: visualization.user.username,
        visualization: visualization.id,
        export_vizjson: data
      )

      backup_entry.save

      true
    end

    def import(visualization_id)
      # TODO: support partial restores
      visualization = Carto::Visualization.where(id: visualization_id).first
      raise "Visualization with id #{visualization_id} already exists!" if visualization

      restore_data = Carto::VisualizationBackup.where(visualization: visualization_id).first
      raise "Restore data not found for visualization id #{visualization_id}" unless restore_data

      dump_data = ::JSON.parse(restore_data.export_vizjson)

      user = ::User.where(id: dump_data["owner"]["id"]).first

      # TODO: Import base layer instead of using default one if present
      base_layer = CartoDB::Factories::LayerFactory.get_default_base_layer(user)
      map = CartoDB::Factories::MapFactory.get_map(base_layer, user.id)
      map.add_layer(base_layer)

      dump_data["layers"].select { |layer| layer["type"] == "layergroup" }.each do |layergroup|
        layergroup["options"]["layer_definition"]["layers"].each do |layer|
          # TODO: new factory method to "get_data_layer"
          data_layer = CartoDB::Factories::LayerFactory.get_default_data_layer(layer["options"]["table_name"], user)
          map.add_layer(data_layer)
        end
      end

      dump_data["layers"].select { |layer| ::Layer::DATA_LAYER_KINDS.include?(layer["type"]) }.each do |layer|
        # TODO: new factory method to "get_data_layer"
        data_layer = CartoDB::Factories::LayerFactory.get_default_data_layer(layer["options"]["table_name"], user)
        map.add_layer(data_layer)
      end

      # TODO: Import labels layer instead of using default one if present
      if base_layer.supports_labels_layer?
        labels_layer = CartoDB::Factories::LayerFactory.get_default_labels_layer(base_layer)
        map.add_layer(labels_layer)
      end

      visualization = CartoDB::Visualization::Member.new(
        id: dump_data["id"],
        name: dump_data["title"],
        description: dump_data["description"],
        type: CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: CartoDB::Visualization::Member::PRIVACY_LINK,
        user_id: dump_data["owner"]["id"],
        map_id: map.id,
        kind: CartoDB::Visualization::Member::KIND_GEOM
      )

      visualization.store

      true
    end
  end
end
