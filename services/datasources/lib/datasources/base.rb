# encoding: utf-8

module CartoDB
  module Datasources
    class Base

      # .csv
      FORMAT_CSV = 'csv'
      # .xls .xlsx
      FORMAT_EXCEL = 'xls'
      # .GPX
      FORMAT_GPX = 'gpx'
      # .KML
      FORMAT_KML = 'kml'
      # .png
      FORMAT_PNG = 'png'
      # .jpg .jpeg
      FORMAT_JPG = 'jpg'
      # .svg
      FORMAT_SVG = 'svg'
      # .zip
      FORMAT_COMPRESSED = 'zip'

      # Factory method
      # @param config {}
      # @return mixed
      def get_new(config)
        raise 'To be implemented in child classes'
      end

      # If will provide a url to download the resource, or requires calling get_resource()
      # @return bool
      def providers_download_url?
        raise  'To be implemented in child classes'
      end

      # Perform the listing and return results
      # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
      # @return [ { :id, :title, :url, :service, :filename, :checksum, :size } ]
      def get_resources_list(filter={})
        raise 'To be implemented in child classes'
      end

      # Retrieves a resource and returns its contents
      # @param id string
      # @return mixed
      def get_resource(id)
        raise 'To be implemented in child classes'
      end

      # @param id string
      # @return Hash
      def get_resource_metadata(id)
        raise 'To be implemented in child classes'
      end #get_resource_metadata

      # Retrieves current filters
      # @return {}
      def filter
        raise 'To be implemented in child classes'
      end

      # Sets current filters
      # @param filter_data {}
      def filter=(filter_data={})
        raise 'To be implemented in child classes'
      end

      # Just return datasource name
      # @return string
      def to_s
        raise 'To be implemented in child classes'
      end

      private_class_method :new

    end #Base
  end #Datasources
end #CartoDB
