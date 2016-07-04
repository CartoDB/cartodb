# encoding: utf-8

module Carto
  module Api
    class MapcapPresenter

      def initialize(mapcap)
        @mapcap = mapcap
      end

      def to_poro
        return {} unless @mapcap

        {
          id: @mapcap.id,
          ids_json: @mapcap.ids_json,
          state_json: @mapcap.state_json,
          created_at: @mapcap.created_at
        }
      end
    end
  end
end
