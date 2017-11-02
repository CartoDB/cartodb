require 'csv'

module Carto
  module Export
    class MapStatistics

      attr_reader :filepath

      def initialize(types: ['derived'])
        @types = types
        @headers_written = false
        @filepath = "/tmp/map_statistics_#{Time.now.strftime('%Y%m%d%H%M%S')}.csv"
      end

      def run!
        csv = CSV.open(filepath, 'wb', headers: true)
        Carto::Visualization.where(type: @types).find_each { |vis| process_row(statistics_for_visualization(vis), csv) if vis.user.present? }
        csv.close
      end

      private

      def process_row(row, csv)
        if !@headers_written
          csv << row.keys
          @headers_written = true
        end
        csv << row.values
      end

      def statistics_for_visualization(visualization)
        analysis_nodes = visualization.analyses.flat_map { |a| a.analysis_node.descendants }.uniq(&:id)
        {
          id: visualization.id,
          total_data_layers: visualization.data_layers.count,
          total_analysis_nodes: analysis_nodes.count,
          non_source_analysis_nodes: analysis_nodes.reject(&:source?).count,
          analysis_nodes_per_layer: (analysis_nodes.count.to_f / visualization.layers.count.to_f).round(2),
          user_account_type: visualization.user.account_type,
          creation_date: visualization.created_at,
          type: visualization.builder? ? 'builder' : 'editor'
        }
      end
    end
  end
end
