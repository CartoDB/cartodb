# encoding: utf-8

module Carto
  module Api
    class AnalysisPresenter

      def initialize(analysis)
        @analysis = analysis
      end

      def to_poro
        return {} unless @analysis

        layer_ids = @analysis.visualization.data_layers.map(&:id)

        analysis_node = @analysis.analysis_node
        analysis_node.descendants.each do |node|
          style_history = LayerNodeStyle.where(layer_id: layer_ids, source_id: node.id).all
          node.options[:style_history] = style_history.map { |lns|
            [
              lns.layer_id,
              {
                tooltip: lns.tooltip,
                infowindow: lns.infowindow,
                options: lns.options
              }
            ]
          }.to_h
        end

        {
          id: @analysis.id,
          analysis_definition: @analysis.analysis_definition
        }
      end

    end
  end
end
