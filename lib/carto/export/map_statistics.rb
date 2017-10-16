require 'csv'

module Carto
  module Export
    class MapStatistics

      attr_reader :filepath

      def initialize(types: ['derived'])
        @types = types
        @headers_written = false
        @filepath = "/tmp/map_statistics_#{SecureRandom.urlsafe_base64}.csv"
      end

      def run!
        csv = CSV.open(filepath, 'wb', headers: true)
        Carto::Visualization.where(type: @types).find_each { |vis| process_row(statistics_for_visualization(vis), csv) }
        csv.close()
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
        {
          id: visualization.id,
          total_data_layers: visualization.data_layers.count,
          total_analyses: visualization.analyses.count,
          user_account_type: visualization.user.account_type,
          creation_date: visualization.created_at,
          type: visualization.builder? ? 'builder' : 'editor'
        }
      end
    end
  end
end
