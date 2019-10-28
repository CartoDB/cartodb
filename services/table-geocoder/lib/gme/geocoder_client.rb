require_relative 'client'
require_relative 'convert'


module Carto
  module Gme

    # The responsibility of this class is to geocode addresses by requesting gme.
    class GeocoderClient

      attr_reader :client

      def initialize(client)
        @client = client
      end

      def geocode(address=nil, components=nil, bounds=nil, region=nil, language=nil)
        params = {}
        params['address'] = address if address
        params['components'] = Convert.components(components) if components # TODO convert
        params['bounds'] = Convert.bounds(bounds) if bounds # TODO convert
        params['region'] = region if region
        params['language'] = language if language

        client.get('/maps/api/geocode/json', params)
      end
    end

  end
end
