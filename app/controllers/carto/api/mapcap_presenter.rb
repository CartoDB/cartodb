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
          related_ids: @mapcap.ids_json,
          created_at: @mapcap.created_at
        }
      end
    end
  end
end
