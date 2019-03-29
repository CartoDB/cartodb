module Carto
  module LayerImporter
    private

    def build_layers_from_hash(exported_layers)
      return [] unless exported_layers

      exported_layers.map.with_index.map { |layer, i| build_layer_from_hash(layer, order: i) }
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

    def build_legends_from_hash(exported_legends, layer)
      return [] unless exported_legends

      exported_legends.map do |exported_legend|
        legend = Legend.new(exported_legend)
        legend.layer = layer

        legend
      end
    end

    def build_widgets_from_hash(exported_widgets, layer:)
      return [] unless exported_widgets

      exported_widgets.map.with_index.map do |widget, index|
        build_widget_from_hash(widget, order: index, layer: layer)
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
        source_id: exported_widget[:source_id],
        style: exported_widget[:style]
      )
    end
  end

  module LayerExporter
    private

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

    def export_widget(widget)
      {
        options: widget.options,
        type: widget.type,
        title: widget.title,
        source_id: widget.source_id,
        order: widget.order,
        style: widget.style
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
end
