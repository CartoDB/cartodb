# encoding: utf-8

require 'cgi'

require_relative "../../controllers/carto/api/visualization_vizjson_adapter"

module Carto
  class VisualizationsExportService

    SERVICE_VERSION = 2

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
    rescue => exception
      raise VisualizationsExportServiceError.new("Export error: #{exception.message} #{exception.backtrace}")
    end

    def import(visualization_id, skip_version_check = false)
      restore_result = restore_backup(visualization_id, skip_version_check)
      remove_backup(visualization_id) if restore_result
      true
    rescue => exception
      raise VisualizationsExportServiceError.new("Import error: #{exception.message} #{exception.backtrace}")
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

    def restore_backup(visualization_id, skip_version_check)
      # TODO: support partial restores
      visualization = Carto::Visualization.where(id: visualization_id).first
      if visualization
        raise VisualizationsExportServiceError.new("Visualization with id #{visualization_id} already exists!")
      end

      dump_data = get_restore_data(visualization_id, skip_version_check)

      user = ::User.where(id: dump_data["owner"]["id"]).first

      base_layer = create_base_layer(dump_data)

      map = create_map(user, base_layer)

      add_data_layers(map, dump_data)

      add_labels_layer(map, base_layer, dump_data)

      set_map_data(map, dump_data)

      visualization = create_visualization(
        id: dump_data["id"],
        name: dump_data["title"],
        description: CGI.unescapeHTML(dump_data["description"]),
        type: CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: CartoDB::Visualization::Member::PRIVACY_LINK,
        user_id: user.id,
        map_id: map.id,
        kind: CartoDB::Visualization::Member::KIND_GEOM
      )

      add_overlays(visualization, dump_data)

      true
    end

    def get_restore_data(visualization_id, skip_version_check)
      restore_data = Carto::VisualizationBackup.where(visualization: visualization_id).first
      unless restore_data
        raise VisualizationsExportServiceError.new("Restore data not found for visualization id #{visualization_id}")
      end
      data = ::JSON.parse(restore_data.export_vizjson)

      if data["export_version"] != SERVICE_VERSION && !skip_version_check
        raise VisualizationsExportServiceError.new(
          "Stored data has different version (#{data['export_version']}) than Service (#{SERVICE_VERSION})")
      end

      data
    end

    def add_overlays(visualization, exported_data)
      exported_data["overlays"].each do |exported_overlay|
        CartoDB::Overlay::Member.new(exported_overlay.merge('visualization_id' => visualization.id)).store
      end

      true
    end

    def set_map_data(map, exported_data)
      map.recalculate_bounds!

      map.scrollwheel = exported_data["scrollwheel"]
      map.legends = exported_data["legends"]
      map.view_bounds_sw = exported_data["bounds"][0].to_s
      map.view_bounds_ne = exported_data["bounds"][1].to_s
      map.center = exported_data["center"]
      map.zoom = exported_data["zoom"]

      map.save.reload
    end

    def prepare_layer_data(exported_layer)
      data = exported_layer.except('id', 'children', 'type', 'legend', 'visible')
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

    def add_data_layer(map, layer_data)
      data_layer = CartoDB::Factories::LayerFactory.get_new(prepare_layer_data(layer_data))
      map.add_layer(data_layer)
      data_layer
    end

    def add_labels_layer(map, base_layer, exported_data)
      return unless base_layer.supports_labels_layer?

      base_layers = exported_data["layers"].select { |layer| ::Layer::BASE_LAYER_KINDS.include?(layer["type"]) }

      if base_layers.count == 1
        # Missing labels layer, regenerate it
        add_default_labels_layer(map, base_layer)
      else
        labels_layer = CartoDB::Factories::LayerFactory.get_new(prepare_layer_data(base_layers.last))
        map.add_layer(labels_layer)
        labels_layer
      end
    end

    def create_map(user, base_layer)
      map = CartoDB::Factories::MapFactory.get_map(base_layer, user.id)
      map.add_layer(base_layer)
      map
    end

    def add_data_layers(map, exported_data)
      exported_data["layers"].select { |layer|
                                       kind = layer_kind_from_type(layer["type"])
                                       ::Layer::DATA_LAYER_KINDS.include?(kind)
                                     }
                             .each { |layer|
                                     add_data_layer(map, layer)
                                   }
    end

    def create_visualization(attributes)
      visualization = CartoDB::Visualization::Member.new(attributes)
      visualization.store
      visualization
    end

    def add_default_labels_layer(map, base_layer)
      labels_layer = CartoDB::Factories::LayerFactory.get_default_labels_layer(base_layer)
      map.add_layer(labels_layer)
      labels_layer
    end

  end

  class VisualizationsExportServiceError < StandardError; end
end
