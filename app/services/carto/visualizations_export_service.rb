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
        viewer_user: visualization.user
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
      restore_result = restore_backup(visualization_id)
      remove_backup(visualization_id) if restore_result
      true
    end

    private

    def remove_backup(visualization_id)
      backup_item = Carto::VisualizationBackup.where(visualization: visualization_id).first
      if backup_item
        backup_item.destroy
        true
      else
        false
      end
    end

    def restore_backup(visualization_id)
      # TODO: support partial restores
      visualization = Carto::Visualization.where(id: visualization_id).first
      raise "Visualization with id #{visualization_id} already exists!" if visualization

      restore_data = Carto::VisualizationBackup.where(visualization: visualization_id).first
      raise "Restore data not found for visualization id #{visualization_id}" unless restore_data

      dump_data = ::JSON.parse(restore_data.export_vizjson)

      user = ::User.where(id: dump_data["owner"]["id"]).first

      base_layer = create_base_layer(dump_data)
      map = create_map(user, base_layer)

      create_data_layers(user, map, dump_data)

      # TODO: Import labels layer instead of using default one if present.
      # but leave this for scenario of needing and not having them
      create_default_labels_layer(map, base_layer) if base_layer.supports_labels_layer?

      create_visualization(
        id: dump_data["id"],
        name: dump_data["title"],
        description: dump_data["description"],
        type: CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: CartoDB::Visualization::Member::PRIVACY_LINK,
        user_id: dump_data["owner"]["id"],
        map_id: map.id,
        kind: CartoDB::Visualization::Member::KIND_GEOM
      )

      true
    end

    def prepare_layer_data(exported_layer)
      data = exported_layer.except('id', 'children', 'type')

      data['kind'] = layer_kind_from_type(exported_layer['type'])

      data
    end

    def layer_kind_from_type(exported_layer_type)
      if exported_layer_type == 'CartoDB'
        'carto'
      else
        exported_layer_type.downcase
      end
    end

    def create_base_layer(exported_data)
      layer_data = exported_data["layers"].select { |layer| ::Layer::BASE_LAYER_KINDS.include?(layer["type"]) }.first
      CartoDB::Factories::LayerFactory.get_new(prepare_layer_data(layer_data))
    end

    def create_map(user, base_layer)
      map = CartoDB::Factories::MapFactory.get_map(base_layer, user.id)
      map.add_layer(base_layer)
      map
    end

    # ---- OLD:

    def create_default_labels_layer(map, base_layer)
      labels_layer = CartoDB::Factories::LayerFactory.get_default_labels_layer(base_layer)
      map.add_layer(labels_layer)
      labels_layer
    end

    def create_data_layer(user, map, layer_data)
      # TODO: new factory method to "get_data_layer" and set proper data
      data_layer = CartoDB::Factories::LayerFactory.get_default_data_layer(layer_data["options"]["table_name"], user)
      map.add_layer(data_layer)
      data_layer
    end

    def create_data_layers(user, map, exported_data)
      # .reverse needed because layers come in increasing order but upon creation insertion is always at top
      exported_data["layers"].select { |layer|
                                       kind = layer_kind_from_type(layer["type"])
                                       ::Layer::DATA_LAYER_KINDS.include?(kind)
                                     }
                             .each { |layer|
                                     create_data_layer(user, map, layer)
                                   }
    end

    def create_visualization(attributes)
      visualization = CartoDB::Visualization::Member.new(attributes)
      visualization.store
    end

  end
end
