module Carto
  module Api
    class AnalysisPresenter

      def initialize(analysis)
        @analysis = analysis
      end

      def to_poro
        return {} unless @analysis

        @analysis.analysis_node.descendants.each do |node|
          style_history = Carto::LayerNodeStyle.from_visualization_and_source(@analysis.visualization, node.id)
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
