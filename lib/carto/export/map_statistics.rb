module Carto
  module Export
    class MapStatistics
      FILE_MODE = :file
      STDOUT_MODE = :stdout
      VALID_MODES = [FILE_MODE, STDOUT_MODE].freeze

      def initialize(mode: :file, path: nil, types: ['derived'])
        assert_valid_mode(mode)
        @mode = mode
        @path = path || "/tmp/map_statistics_#{SecureRandom.urlsafe_base64}.csv"
        @types = types
      end

      def run!
        @out = @mode == :file ? File.new(@path, 'w+') : STDOUT
        result = []
        Carto::Visualization.where(type: @types).find_each { |vis| result << statistics_for_visualization(vis) }
        @out.write(result[0].keys.join(', ') + "\n")
        result.each { |row| @out.write(row.values.join(', ') + "\n") }
        self
      ensure
        @out.close if @mode == :file
        puts("You can see your results here: #{@out.path}") if @mode == :file
      end

      private

      def statistics_for_visualization(visualization)
        {
          name: visualization.name,
          total_data_layers: visualization.data_layers.count,
          total_analyses: visualization.analyses.count,
          user_account_type: visualization.user.account_type,
          creation_date: visualization.created_at,
          type: visualization.builder? ? 'builder' : 'editor'
        }
      end

      def assert_valid_mode(mode)
        raise "Invalid mode: #{mode}" unless VALID_MODES.include?(mode)
      end
    end
  end
end
