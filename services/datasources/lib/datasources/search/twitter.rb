# encoding: utf-8

require 'typhoeus'

module CartoDB
  module Datasources
    module Search
      class Twitter < Base

        # Required for all datasources
        DATASOURCE_NAME = 'twitter_search'

        NO_MAX_RESULTS = -1

        ALLOWED_FILTERS = [
            # From twitter
            'query', 'maxResults', 'fromDate', 'toDate',
            # Internal
            'term1', 'term2', 'term3', 'term4', 'max_results'
        ]

        # Constructor (hidden)
        # @param config Hash
        def initialize(config)
          @service_name = DATASOURCE_NAME
          @filters = Hash.new
        end

        # Factory method
        # @param config {}
        # @return CartoDB::Datasources::Search::TwitterSearch
        def self.get_new(config={})
          return new(config)
        end

        # If will provide a url to download the resource, or requires calling get_resource()
        # @return bool
        def providers_download_url?
          false
        end

        # Perform the listing and return results
        # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
        # @return [ { :id, :title, :url, :service } ]
        def get_resources_list(filter=[])
          nil
        end

        # Retrieves a resource and returns its contents
        # @param id string
        # @return mixed
        # @throws DataDownloadError
        def get_resource(id)
          raise 'TBD'
        end

        # @param id string
        # @return Hash
        def get_resource_metadata(id)
          raise 'TBD'

          #fetch_headers(id)
          #{
          #    id:       id,
          #    title:    id,
          #    url:      id,
          #    service:  DATASOURCE_NAME,
          #    checksum: checksum_of(id, etag_header, last_modified_header),
          #    size:     0
          #    # No need to use :filename nor file
          #}
        end

        # Retrieves current filters
        # @return {}
        def filter
          @filters
        end

        # Sets current filters
        # @param filter_data {}
        def filter=(filter_data=[])
          filter_data.each { |k, v|
            if ALLOWED_FILTERS.include? k

            end
          }

          raise 'TBD'
        end

        # Just return datasource name
        # @return string
        def to_s
          DATASOURCE_NAME
        end

        private

        # Calculates a checksum of given url
        # @return string
        def checksum_of(url, etag, last_modified)
          # TODO: Use filters here as basis for checksumming


          #noinspection RubyArgCount
          Zlib::crc32(url + etag + last_modified).to_s
        end

        # HTTP (Typhoeus) options
        def http_options
          {
              followlocation: true,
              ssl_verifypeer: false,
              ssl_verifyhost: 0
          }
        end

      end
    end
  end
end
