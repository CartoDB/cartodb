# encoding: utf-8

require 'cgi'
require 'date'

require_relative "../../controllers/carto/api/visualization_vizjson_adapter"

module Carto
  class VisualizationsExportService

    FEATURE_FLAG_NAME = "visualizations_backup"

    DAYS_TO_KEEP_BACKUP = 15

    SERVICE_VERSION = 1

    def purge_old
      items = retrieve_old_backups
      items.each do |item|
        remove_backup(item)
      end
      items.length
    end

    def export(visualization_id)
      visualization = Carto::Visualization.where(id: visualization_id).first
      raise "Visualization with id #{visualization_id} not found" unless visualization

      data = export_to_json(visualization)

      backup_present = Carto::VisualizationBackup.where(
        username: visualization.user.username,
        visualization: visualization.id).first != nil

      if backup_present
        false
      else
        backup_entry = Carto::VisualizationBackup.new(
          username: visualization.user.username,
          visualization: visualization.id,
          export_vizjson: data
        )
        backup_entry.save

        true
      end
    rescue VisualizationsExportServiceError => export_error
      raise export_error
    rescue => exception
      raise VisualizationsExportServiceError.new("Export error: #{exception.message} #{exception.backtrace}")
    end

    def export_to_json(visualization)
      vizjson_options = {
        full: true,
        user_name: visualization.user.username,
        user_api_key: visualization.user.api_key,
        user: visualization.user,
        viewer_user: visualization.user
      }

      CartoDB::Visualization::VizJSON.new(
        Carto::Api::VisualizationVizJSONAdapter.new(visualization, $tables_metadata), vizjson_options, Cartodb.config)
                                            .to_export_poro(export_version)
                                            .to_json
    end

    def import(visualization_id, skip_version_check = false)
      restore_result = restore_backup(visualization_id, skip_version_check)
      remove_backup(visualization_id) if restore_result
      true
    rescue VisualizationsExportServiceError => export_error
      raise export_error
    rescue => exception
      raise VisualizationsExportServiceError.new("Import error: #{exception.message} #{exception.backtrace}")
    end

    def restore_from_json(dump_data)
      user = ::User.where(id: dump_data["owner"]["id"]).first

      base_layer = create_base_layer(user, dump_data)

      map = create_map(user, base_layer)

      add_data_layers(map, dump_data)

      add_labels_layer(map, base_layer, dump_data)

      set_map_data(map, dump_data)

      description = dump_data["description"]

      default_privacy = CartoDB::Visualization::Member::PRIVACY_LINK
      privacy = user.valid_privacy?(default_privacy) ? default_privacy : CartoDB::Visualization::Member::PRIVACY_PUBLIC
      visualization = create_visualization(
        id: dump_data["id"],
        name: dump_data["title"],
        description: (description.nil? || description.empty?) ? "" : CGI.unescapeHTML(description),
        type: CartoDB::Visualization::Member::TYPE_DERIVED,
        privacy: privacy,
        user_id: user.id,
        map_id: map.id,
        kind: CartoDB::Visualization::Member::KIND_GEOM
      )

      add_overlays(visualization, dump_data)

      true
    end

    private

    # Mainly intended for testing
    def export_version
      SERVICE_VERSION
    end

    def retrieve_old_backups
      max_date = Date.today - DAYS_TO_KEEP_BACKUP
      Carto::VisualizationBackup.where("created_at <= ?", max_date).pluck(:visualization)
    end

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

      restore_from_json(dump_data)
    end

    def get_restore_data(visualization_id, skip_version_check)
      restore_data = Carto::VisualizationBackup.where(visualization: visualization_id).first
      unless restore_data
        raise VisualizationsExportServiceError.new("Restore data not found for visualization id #{visualization_id}")
      end
      data = ::JSON.parse(restore_data.export_vizjson)

      if data["export_version"] != export_version && !skip_version_check
        raise VisualizationsExportServiceError.new(
          "Stored data has different version (#{data['export_version']}) than Service (#{export_version})")
      end

      data
    end

    def add_overlays(visualization, exported_data)
      exported_data["overlays"].each do |exported_overlay|
        Carto::Overlay.new(exported_overlay.merge('visualization_id' => visualization.id)).save
      end

      true
    end

    def set_map_data(map, exported_data)
      map.recalculate_bounds!

      map.scrollwheel = exported_data["scrollwheel"] if exported_data["scrollwheel"]
      map.legends = exported_data["legends"] if exported_data["legends"]
      if exported_data["bounds"] && exported_data["bounds"].length == 2
        map.view_bounds_sw = exported_data["bounds"][0].to_s
        map.view_bounds_ne = exported_data["bounds"][1].to_s
      end
      map.center = exported_data["center"] if exported_data["center"]
      map.zoom = exported_data["zoom"] if exported_data["zoom"]
      map.provider = exported_data["map_provider"] if exported_data["map_provider"]

      map.save
         .reload
    end

    def prepare_layer_data(exported_layer)
      data = exported_layer.except('id', 'type', 'legend', 'visible')
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

    def create_base_layer(user, exported_data)
      # Basemap/base layer is always the first layer
      layer_data = exported_data["layers"].select { |layer| ::Layer::BASE_LAYER_KINDS.include?(layer["type"]) }.first
      if layer_data.nil?
        ::ModelFactories::LayerFactory.get_default_base_layer(user)
      else
        ::ModelFactories::LayerFactory.get_new(prepare_layer_data(layer_data))
      end
    end

    def add_data_layer(map, layer_data)
      data_layer = ::ModelFactories::LayerFactory.get_new(prepare_layer_data(layer_data))
      map.add_layer(data_layer)
      data_layer
    end

    def add_labels_layer(map, base_layer, exported_data)
      return unless base_layer.supports_labels_layer?

      base_layers = exported_data["layers"].select { |layer| ::Layer::BASE_LAYER_KINDS.include?(layer["type"]) }

      # Remember, basemap layer is 1st one...
      if base_layers.count < 2
        # Missing labels layer, regenerate it
        add_default_labels_layer(map, base_layer)
      else
        # ...And labels layer is always last one
        labels_layer = ::ModelFactories::LayerFactory.get_new(prepare_layer_data(base_layers.last))
        map.add_layer(labels_layer)
        labels_layer
      end
    end

    def create_map(user, base_layer)
      map = ::ModelFactories::MapFactory.get_map(base_layer, user.id)
      map.add_layer(base_layer)
      map
    end

    def add_data_layers(map, exported_data)
      data_layers = exported_data["layers"].select do |layer|
        kind = layer_kind_from_type(layer["type"])
        ::Layer::DATA_LAYER_KINDS.include?(kind)
      end
      data_layers.each do |layer|
        add_data_layer(map, layer)
      end
    end

    def create_visualization(attributes)
      visualization = CartoDB::Visualization::Member.new(attributes)
      visualization.store
      visualization
    end

    def add_default_labels_layer(map, base_layer)
      labels_layer = ::ModelFactories::LayerFactory.get_default_labels_layer(base_layer)
      map.add_layer(labels_layer)
      labels_layer
    end

  end

  class VisualizationsExportServiceError < StandardError; end
end
