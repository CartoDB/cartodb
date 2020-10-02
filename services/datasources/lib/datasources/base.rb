module CartoDB
  module Datasources
    class Base

      # .csv
      FORMAT_CSV = 'csv'.freeze
      # .xls .xlsx
      FORMAT_EXCEL = 'xls'.freeze
      # .GPX
      FORMAT_GPX = 'gpx'.freeze
      # .KML
      FORMAT_KML = 'kml'.freeze
      # .png
      FORMAT_PNG = 'png'.freeze
      # .jpg .jpeg
      FORMAT_JPG = 'jpg'.freeze
      # .svg
      FORMAT_SVG = 'svg'.freeze
      # .zip
      FORMAT_COMPRESSED = 'zip'.freeze

      # If data size cannot be determined, this will be returned as its size in the item metadata
      NO_CONTENT_SIZE_PROVIDED = 0

      def initialize(*_args)
        @logger = nil
      end

      # Small helper method to know if metadata includes a valid resource size value or not
      # @param resource_metadata Hash { :size, ... }
      # @return bool
      def has_resource_size?(resource_metadata)
        resource_metadata[:size] && resource_metadata[:size] > NO_CONTENT_SIZE_PROVIDED
      end

      # Factory method
      # @param config {}
      # @return mixed
      def get_new(_config)
        raise 'To be implemented in child classes'
      end

      # If will provide a url to download the resource, or requires calling get_resource()
      # @return bool
      def providers_download_url?
        raise 'To be implemented in child classes'
      end

      # If will provide the url http response code
      # @return string
      def get_http_response_code
        raise 'To be implemented in child classes'
      end

      # Perform the listing and return results
      # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
      # @return [ { :id, :title, :url, :service, :filename, :checksum, :size } ]
      def get_resources_list(_filter={})
        raise 'To be implemented in child classes'
      end

      # Retrieves a resource and returns its contents
      # @param id string
      # @return mixed
      def get_resource(_id)
        raise 'To be implemented in child classes'
      end

      # @param id string
      # @return Hash
      def get_resource_metadata(_id)
        raise 'To be implemented in child classes'
      end

      # Retrieves current filters
      # @return {}
      def filter
        raise 'To be implemented in child classes'
      end

      # Sets current filters
      # @param filter_data {}
      def filter=(_filter_data={})
        raise 'To be implemented in child classes'
      end

      # Log a message
      # @param message String
      def log(message)
        puts message if @logger.nil?
        @logger.append(message) unless @logger.nil?
      end

      # @param logger Mixed|nil Set or unset the logger
      def logger=(logger=nil)
        @logger = logger
      end

      # Just return datasource name
      # @return string
      def to_s
        raise 'To be implemented in child classes'
      end

      # If this datasource accepts a data import instance
      # @return Boolean
      def persists_state_via_data_import?
        raise 'To be implemented in child classes'
      end

      def set_audit_to_completed(_table_id = nil)
        raise 'To be implemented in child classes'
      end

      def set_audit_to_failed
        raise 'To be implemented in child classes'
      end

      # @return Hash
      def get_audit_stats
        raise 'To be implemented in child classes'
      end

      # Stores the data import item instance to use/manipulate it
      # @param value DataImport
      def data_import_item=(_value)
        raise 'To be implemented in child classes'
      end

      # If true, a single resource id might return >1 subresources (each one spawning a table)
      # @param id String
      # @return Bool
      def multi_resource_import_supported?(_id)
        false
      end

      private_class_method :new

    end
  end
end
