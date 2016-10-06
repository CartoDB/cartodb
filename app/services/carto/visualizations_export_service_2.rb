require 'json'

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
module Carto
  module VisualizationsExportService2Configuration
    CURRENT_VERSION = '2.0.6'.freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module VisualizationsExportService2Validator
    def check_valid_visualization(visualization)
      raise 'Only derived visualizations can be exported' unless visualization.derived?
    end
  end

  module VisualizationsExportService2Importer
    include VisualizationsExportService2Configuration

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
        analyses: exported_visualization[:analyses].map { |a| build_analysis_from_hash(a.deep_symbolize_keys) }
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
        layers: layers
      )
    end

    def build_layers_from_hash(exported_layers)
      return [] unless exported_layers

      exported_layers.map.with_index.map { |layer, i| build_layer_from_hash(layer.deep_symbolize_keys, order: i) }
    end

    # user_name is not cleaned to ease username replacement at sql rewriting (see #7380)
    LAYER_OPTIONS_WITH_IDS = [:id, :stat_tag].freeze

    def build_layer_from_hash(exported_layer, order:)
      options = exported_layer[:options]
      LAYER_OPTIONS_WITH_IDS.each do |option_key|
        options[option_key] = nil if options.has_key?(option_key)
      end

      # Indifferent access is used to keep symbol/string hash coherence with Layer serializers.

      options_with_indifferent_access = options.with_indifferent_access

      infowindow = exported_layer[:infowindow]
      infowindow_with_indifferent_access = infowindow.with_indifferent_access if infowindow

      tooltip = exported_layer[:tooltip]
      tooltip_with_indifferent_access = tooltip.with_indifferent_access if tooltip

      layer = Carto::Layer.new(
        options: options_with_indifferent_access,
        kind: exported_layer[:kind],
        infowindow: infowindow_with_indifferent_access,
        order: order,
        tooltip: tooltip_with_indifferent_access
      )
      layer.widgets = build_widgets_from_hash(exported_layer[:widgets], layer: layer)
      layer.legends = build_legends_from_hash(exported_layer[:legends], layer)
      layer
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

    def build_legends_from_hash(exported_legends, layer)
      return [] unless exported_legends

      exported_legends.map do |exported_legend|
        legend = Legend.new(exported_legend)
        legend.layer = layer

        legend
      end
    end

    def build_analysis_from_hash(exported_analysis)
      return nil unless exported_analysis

      Carto::Analysis.new(analysis_definition: exported_analysis[:analysis_definition])
    end

    def build_widgets_from_hash(exported_widgets, layer:)
      return [] unless exported_widgets

      exported_widgets.map.with_index.map do |widget, index|
        build_widget_from_hash(widget.deep_symbolize_keys, order: index, layer: layer)
      end
    end

    def build_widget_from_hash(exported_widget, order:, layer:)
      return nil unless exported_widget

      Carto::Widget.new(
        order: exported_widget[:order] || order, # Order added to export on 2.0.5
        layer: layer,
        type: exported_widget[:type],
        title: exported_widget[:title],
        options: exported_widget[:options],
        source_id: exported_widget[:source_id]
      )
    end

    def build_state_from_hash(exported_state)
      Carto::State.new(json: exported_state ? exported_state[:json] : nil)
    end
  end

  module VisualizationsExportService2Exporter
    include VisualizationsExportService2Configuration
    include VisualizationsExportService2Validator

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
        state: export_state(visualization.state)
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
        legends: map.legends
      }
    end

    def export_layer(layer, active_layer: false)
      layer = {
        options: layer.options,
        kind: layer.kind,
        infowindow: layer.infowindow,
        tooltip: layer.tooltip,
        widgets: layer.widgets.map { |widget| export_widget(widget) },
        legends: layer.legends.map { |legend| export_legend(legend) }
      }

      layer[:active_layer] = true if active_layer

      layer
    end

    def export_overlay(overlay)
      {
        options: overlay.options,
        type: overlay.type,
        template: overlay.template
      }
    end

    def export_widget(widget)
      {
        options: widget.options,
        type: widget.type,
        title: widget.title,
        source_id: widget.source_id,
        order: widget.order
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

    def export_legend(legend)
      {
        definition: legend.definition,
        post_html: legend.post_html,
        pre_html: legend.pre_html,
        title: legend.title,
        type: legend.type
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
