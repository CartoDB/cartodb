require_relative 'base'

module CartoDB
  module Datasources
    # Performs streaming from the datasource directly to the caller in batches
    class BaseDirectStream < Base

      # Initial stream, to be used for container creation (table usually)
      # @param id string
      # @return String
      def initial_stream(id)
        raise 'To be implemented in child classes'
      end

      # @param id string
      # @return String
      def stream_resource(id)
        raise 'To be implemented in child classes'
      end

      private_class_method :new

    end
  end
end
