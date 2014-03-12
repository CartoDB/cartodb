# encoding: utf-8

module CartoDB
  module Datasources
    class Base

      # .csv
      FORMAT_CSV = 'csv'
      # .xls .xlsx
      FORMAT_EXCEL = 'xls'
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

      # Perform the listing and return results
      # @param filter Array : (Optional) filter to specify which resources to retrieve. Leave empty for all supported.
      # @return [ { :id, :title, :url, :service } ]
      def get_resources_list(filter={})
        raise 'To be implemented in child classes'
      end

      # Retrieves a resource and returns its contents
      # @param id string
      # @return mixed
      def get_resource(id)
        raise 'To be implemented in child classes'
      end

      # Stores a sync table entry
      # @param id string
      # @param {} sync_options
      # @return bool
      def store_resource(id, sync_options={})
        raise 'To be implemented in child classes'
      end

      # Checks if a specific resource has been modified
      # @param id string
      # @return bool
      def resource_modified?(id)
        raise 'To be implemented in child classes'
      end

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

      private_class_method :new

    end #Base
  end #Datasources
end #CartoDB
