
module Carto
  module Api
    class ExternalSourcePresenter

      def initialize(external_source)
        @external_source = external_source
      end

      def to_poro
        return {} if @external_source.nil?

        {
          size: @external_source.size,
          row_count: @external_source.rows_counted,
          geometry_types: @external_source.geometry_types
        }
      end

    end
  end
end
