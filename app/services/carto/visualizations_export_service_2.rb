require 'json'
require_dependency 'carto/export/layer_exporter'
require_dependency 'carto/export/data_import_exporter'

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
# 2.1.0: export datasets: permissions, user_tables and syncs
# 2.1.1: export vizjson2 mark
# 2.1.2: export locked and password
module Carto
  module VisualizationsExportService2Configuration
    CURRENT_VERSION = '2.1.2'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module VisualizationsExportService2Validator
    def check_valid_visualization(visualization)
      raise 'Only derived or canonical visualizations can be exported' unless visualization.derived? ||
                                                                              visualization.canonical? ||
                                                                              visualization.remote?
    end
  end

  module VisualizationsExportService2Importer
    include VisualizationsExportService2Configuration
    include LayerImporter
    include DataImportImporter

    def build_visualization_from_json_export(exported_json_string)
      build_visualization_from_hash_export(parse_json(exported_json_string))
    end

    def build_visualization_from_hash_export(exported_hash)
      raise 'Wrong export version' unless compatible_version?(exported_hash[:version])

      build_visualization_from_hash(exported_hash[:visualization])
    end

    def marked_as_vizjson2_from_json_export?(exported_json_string)
      marked_as_vizjson2_from_hash_export?(parse_json(exported_json_string))
    end

    def marked_as_vizjson2_from_hash_export?(exported_hash)
      exported_hash[:visualization][:uses_vizjson2]
    end

    private

    def parse_json(exported_json_string)
      JSON.parse(exported_json_string, symbolize_names: true)
    end

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
        analyses: exported_visualization[:analyses].map { |a| build_analysis_from_hash(a) },
        permission: build_permission_from_hash(exported_visualization[:permission]),
        mapcaps: [build_mapcap_from_hash(exported_visualization[:mapcap])].compact,
        external_source: build_external_source_from_hash(exported_visualization[:external_source]),
        created_at: exported_visualization[:created_at],
        updated_at: exported_visualization[:updated_at],
        locked: exported_visualization[:locked] || false,
        encrypted_password: exported_visualization[:encrypted_password],
        password_salt: exported_visualization[:password_salt]
      )

      # This is optional as it was added in version 2.0.2
      exported_user = exported_visualization[:user]
      if exported_user
        visualization.user = Carto::User.new(username: exported_user[:username])
      end

      # Added in version 2.0.3
      visualization.state = build_state_from_hash(exported_visualization[:state])

      active_layer_order = exported_layers.index { |l| l[:active_layer] }
      if active_layer_order
        visualization.active_layer = visualization.layers.find { |l| l.order == active_layer_order }
      end

      # Dataset-specific
      user_table = build_user_table_from_hash(exported_visualization[:user_table])
      visualization.map.user_table = user_table if user_table
      visualization.synchronization = build_synchronization_from_hash(exported_visualization[:synchronization])

      visualization.id = exported_visualization[:id] if exported_visualization[:id]
      visualization
    end

    def build_map_from_hash(exported_map, layers:)
      return nil unless exported_map

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
        build_overlay_from_hash(overlay, order: (i + 1))
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
      return nil unless exported_synchronization

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

    def build_user_table_from_hash(exported_user_table)
      return nil unless exported_user_table

      user_table = Carto::UserTable.new
      user_table.name = exported_user_table[:name]
      user_table.privacy = exported_user_table[:privacy]
      user_table.tags = exported_user_table[:tags]
      user_table.geometry_columns = exported_user_table[:geometry_columns]
      user_table.rows_counted = exported_user_table[:rows_counted]
      user_table.rows_estimated = exported_user_table[:rows_estimated]
      user_table.indexes = exported_user_table[:indexes]
      user_table.database_name = exported_user_table[:database_name]
      user_table.description = exported_user_table[:description]
      user_table.table_id = exported_user_table[:table_id]
      user_table.data_import = build_data_import_from_hash(exported_user_table[:data_import])

      user_table
    end

    def build_mapcap_from_hash(exported_mapcap)
      return nil unless exported_mapcap

      Carto::Mapcap.new(
        ids_json: exported_mapcap[:ids_json],
        export_json: exported_mapcap[:export_json],
        created_at: exported_mapcap[:created_at]
      )
    end

    def build_external_source_from_hash(exported_external_source)
      return nil unless exported_external_source

      es = Carto::ExternalSource.new(
        import_url: exported_external_source[:import_url],
        rows_counted: exported_external_source[:rows_counted],
        size: exported_external_source[:size],
        username: exported_external_source[:username],
        geometry_types: exported_external_source[:geometry_types]
      )
      es.id = exported_external_source[:id]

      es
    end
  end

  module VisualizationsExportService2Exporter
    include VisualizationsExportService2Configuration
    include VisualizationsExportService2Validator
    include LayerExporter
    include DataImportExporter

    def export_visualization_json_string(visualization_id, user, with_password: false)
      export_visualization_json_hash(visualization_id, user, with_password: with_password).to_json
    end

    def export_visualization_json_hash(visualization_id, user, with_mapcaps: true, with_password: false)
      {
        version: CURRENT_VERSION,
        visualization: export(Carto::Visualization.find(visualization_id), user,
                              with_mapcaps: with_mapcaps, with_password: with_password)
      }
    end

    private

    def export(visualization, user, with_mapcaps: true, with_password: false)
      check_valid_visualization(visualization)
      export_visualization(visualization, user, with_mapcaps: with_mapcaps, with_password: with_password)
    end

    def export_visualization(visualization, user, with_mapcaps: true, with_password: false)
      layers = visualization.layers_with_data_readable_by(user)
      active_layer_id = visualization.active_layer_id
      layer_exports = layers.map do |layer|
        export_layer(layer, active_layer: active_layer_id == layer.id)
      end

      export = {
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
        synchronization: export_syncronization(visualization.synchronization),
        user_table: export_user_table(visualization.map.try(:user_table)),
        uses_vizjson2: visualization.uses_vizjson2?,
        mapcap: with_mapcaps ? export_mapcap(visualization.latest_mapcap) : nil,
        external_source: export_external_source(visualization.external_source),
        created_at: visualization.created_at,
        updated_at: visualization.updated_at,
        locked: visualization.locked
      }

      if with_password
        export[:encrypted_password] = visualization.encrypted_password
        export[:password_salt] = visualization.password_salt
      end

      export
    end

    def export_user(user)
      {
        username: user.username
      }
    end

    def export_map(map)
      return nil unless map

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

    def export_user_table(user_table)
      return nil unless user_table

      {
        name: user_table.name,
        privacy: user_table.privacy,
        tags: user_table.tags,
        geometry_columns: user_table.geometry_columns,
        rows_counted: user_table.rows_counted,
        rows_estimated: user_table.rows_estimated,
        indexes: user_table.indexes,
        database_name: user_table.database_name,
        description: user_table.description,
        table_id: user_table.table_id,
        data_import: export_data_import(user_table.data_import)
      }
    end

    def export_external_source(external_source)
      return nil unless external_source

      {
        id: external_source.id,
        import_url: external_source.import_url,
        rows_counted: external_source.rows_counted,
        size: external_source.size,
        username: external_source.username,
        geometry_types: external_source.geometry_types
      }
    end

    def export_mapcap(mapcap)
      return nil unless mapcap

      {
        ids_json: mapcap.ids_json,
        export_json: mapcap.export_json,
        created_at: mapcap.created_at
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
