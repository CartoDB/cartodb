require 'json'
require 'carto/export/layer_exporter'

# Version History
# TODO: documentation at http://cartodb.readthedocs.org/en/latest/operations/exporting_importing_visualizations.html
# 2: export full visualization. Limitations:
#   - No Odyssey support: export fails if any of parent_id / prev_id / next_id / slide_transition_options are set.
#   - Privacy is exported, but permissions are not.
# 2.0.1: export Widget.source_id
# 2.0.2: export username
# 2.0.3: export state (Carto::State)
# 2.0.4: export legends (Carto::Legend)
# 2.0.5: export explicit widget order
# 2.0.6: export version
# 2.0.7: export map options
# 2.0.8: export widget style
# 2.0.9: export visualization id
# 2.1.0: export permissions and syncs
module Carto
  module VisualizationsExportService2Configuration
    CURRENT_VERSION = '2.1.0'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module VisualizationsExportService2Validator
    def check_valid_visualization(visualization)
      raise 'Only derived or canonical visualizations can be exported' unless visualization.derived? ||
                                                                              visualization.canonical?
    end
  end

  module VisualizationsExportService2Importer
    include VisualizationsExportService2Configuration
    include LayerImporter

    def build_visualization_from_json_export(exported_json_string)
      build_visualization_from_hash_export(JSON.parse(exported_json_string).deep_symbolize_keys)
    end

    def build_visualization_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      build_visualization_from_hash(exported_hash[:visualization])
    end

    private

    def build_visualization_from_hash(exported_visualization)
      exported_layers = exported_visualization[:layers]
      exported_overlays = exported_visualization[:overlays]

      visualization = Carto::Visualization.new(
        name: exported_visualization[:name],
        description: exported_visualization[:description],
        version: exported_visualization[:version] || 2,
        type: exported_visualization[:type],
        tags: exported_visualization[:tags],
        privacy: exported_visualization[:privacy],
        source: exported_visualization[:source],
        license: exported_visualization[:license],
        title: exported_visualization[:title],
        kind: exported_visualization[:kind],
        attributions: exported_visualization[:attributions],
        bbox: exported_visualization[:bbox],
        display_name: exported_visualization[:display_name],
        map: build_map_from_hash(
          exported_visualization[:map],
          layers: build_layers_from_hash(exported_layers)),
        overlays: build_overlays_from_hash(exported_overlays),
        analyses: exported_visualization[:analyses].map { |a| build_analysis_from_hash(a.deep_symbolize_keys) },
        permission: build_permission_from_hash(exported_visualization[:permission])
      )

      # This is optional as it was added in version 2.0.2
      exported_user = exported_visualization[:user]
      if exported_user
        visualization.user = Carto::User.new(username: exported_user[:username])
      end

      # Added in version 2.0.3
      visualization.state = build_state_from_hash(exported_visualization[:state])

      active_layer_order = exported_layers.index { |l| l['active_layer'] }
      if active_layer_order
        visualization.active_layer = visualization.layers.find { |l| l.order == active_layer_order }
      end

      exported_sync = exported_visualization[:synchronization]
      visualization.synchronization = build_synchronization_from_hash(exported_sync) if exported_sync

      visualization.id = exported_visualization[:id] if exported_visualization[:id]
      visualization
    end

    def build_map_from_hash(exported_map, layers:)
      Carto::Map.new(
        provider: exported_map[:provider],
        bounding_box_sw: exported_map[:bounding_box_sw],
        bounding_box_ne: exported_map[:bounding_box_ne],
        center: exported_map[:center],
        zoom: exported_map[:zoom],
        view_bounds_sw: exported_map[:view_bounds_sw],
        view_bounds_ne: exported_map[:view_bounds_ne],
        scrollwheel: exported_map[:scrollwheel],
        legends: exported_map[:legends],
        layers: layers,
        options: exported_map[:options]
      )
    end

    def build_overlays_from_hash(exported_overlays)
      return [] unless exported_overlays

      exported_overlays.map.with_index.map do |overlay, i|
        build_overlay_from_hash(overlay.deep_symbolize_keys, order: (i + 1))
      end
    end

    def build_overlay_from_hash(exported_overlay, order:)
      Carto::Overlay.new(
        order: order,
        options: exported_overlay[:options],
        type: exported_overlay[:type],
        template: exported_overlay[:template]
      )
    end

    def build_analysis_from_hash(exported_analysis)
      return nil unless exported_analysis

      Carto::Analysis.new(analysis_definition: exported_analysis[:analysis_definition])
    end

    def build_state_from_hash(exported_state)
      Carto::State.new(json: exported_state ? exported_state[:json] : nil)
    end

    def build_permission_from_hash(exported_permission)
      return nil unless exported_permission

      Carto::Permission.new(access_control_list: JSON.dump(exported_permission[:access_control_list]))
    end

    def build_synchronization_from_hash(exported_synchronization)
      Carto::Synchronization.new(
        name: exported_synchronization[:name],
        interval: exported_synchronization[:interval],
        url: exported_synchronization[:url],
        state: exported_synchronization[:state],
        created_at: exported_synchronization[:created_at],
        updated_at: exported_synchronization[:updated_at],
        run_at: exported_synchronization[:run_at],
        retried_times: exported_synchronization[:retried_times],
        log: build_log_from_hash(exported_synchronization[:log]),
        error_code: exported_synchronization[:error_code],
        error_message: exported_synchronization[:error_message],
        ran_at: exported_synchronization[:ran_at],
        modified_at: exported_synchronization[:modified_at],
        etag: exported_synchronization[:etag],
        checksum: exported_synchronization[:checksum],
        service_name: exported_synchronization[:service_name],
        service_item_id: exported_synchronization[:service_item_id],
        type_guessing: exported_synchronization[:type_guessing],
        quoted_fields_guessing: exported_synchronization[:quoted_fields_guessing],
        content_guessing: exported_synchronization[:content_guessing]
      )
    end

    def build_log_from_hash(exported_log)
      Carto::Log.new(type: exported_log[:type], entries: exported_log[:entries])
    end
  end

  module VisualizationsExportService2Exporter
    include VisualizationsExportService2Configuration
    include VisualizationsExportService2Validator
    include LayerExporter

    def export_visualization_json_string(visualization_id, user)
      export_visualization_json_hash(visualization_id, user).to_json
    end

    def export_visualization_json_hash(visualization_id, user)
      {
        version: CURRENT_VERSION,
        visualization: export(Carto::Visualization.find(visualization_id), user)
      }
    end

    private

    def export(visualization, user)
      check_valid_visualization(visualization)
      export_visualization(visualization, user)
    end

    def export_visualization(visualization, user)
      layers = visualization.layers_with_data_readable_by(user)
      active_layer_id = visualization.active_layer_id
      layer_exports = layers.map do |layer|
        export_layer(layer, active_layer: active_layer_id == layer.id)
      end

      {
        id: visualization.id,
        name: visualization.name,
        description: visualization.description,
        version: visualization.version,
        type: visualization.type,
        tags: visualization.tags,
        privacy: visualization.privacy,
        source: visualization.source,
        license: visualization.license,
        title: visualization.title,
        kind: visualization.kind,
        attributions: visualization.attributions,
        bbox: visualization.bbox,
        display_name: visualization.display_name,
        map: export_map(visualization.map),
        layers: layer_exports,
        overlays: visualization.overlays.map { |o| export_overlay(o) },
        analyses: visualization.analyses.map { |a| exported_analysis(a) },
        user: export_user(visualization.user),
        state: export_state(visualization.state),
        permission: export_permission(visualization.permission),
        synchronization: export_syncronization(visualization.synchronization)
      }
    end

    def export_user(user)
      {
        username: user.username
      }
    end

    def export_map(map)
      {
        provider: map.provider,
        bounding_box_sw: map.bounding_box_sw,
        bounding_box_ne: map.bounding_box_ne,
        center: map.center,
        zoom: map.zoom,
        view_bounds_sw: map.view_bounds_sw,
        view_bounds_ne: map.view_bounds_ne,
        scrollwheel: map.scrollwheel,
        legends: map.legends,
        options: map.options
      }
    end

    def export_overlay(overlay)
      {
        options: overlay.options,
        type: overlay.type,
        template: overlay.template
      }
    end

    def exported_analysis(analysis)
      {
        analysis_definition: analysis.analysis_definition
      }
    end

    def export_state(state)
      {
        json: state.json
      }
    end

    def export_permission(permission)
      {
        access_control_list: JSON.parse(permission.access_control_list, symbolize_names: true)
      }
    end

    def export_syncronization(synchronization)
      return nil unless synchronization
      {
        name: synchronization.name,
        interval: synchronization.interval,
        url: synchronization.url,
        state: synchronization.state,
        created_at: synchronization.created_at,
        updated_at: synchronization.updated_at,
        run_at: synchronization.run_at,
        retried_times: synchronization.retried_times,
        log: export_log(synchronization.log),
        error_code: synchronization.error_code,
        error_message: synchronization.error_message,
        ran_at: synchronization.ran_at,
        modified_at: synchronization.modified_at,
        etag: synchronization.etag,
        checksum: synchronization.checksum,
        service_name: synchronization.service_name,
        service_item_id: synchronization.service_item_id,
        type_guessing: synchronization.type_guessing,
        quoted_fields_guessing: synchronization.quoted_fields_guessing,
        content_guessing: synchronization.content_guessing
      }
    end

    def export_log(log)
      {
        type: log.type,
        entries: log.entries
      }
    end
  end

  # Both String and Hash versions are provided because `deep_symbolize_keys` won't symbolize through arrays
  # and having separated methods make handling and testing much easier.
  class VisualizationsExportService2
    include VisualizationsExportService2Importer
    include VisualizationsExportService2Exporter
  end
end
