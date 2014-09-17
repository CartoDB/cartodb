# encoding: utf-8

module CartoDB
  module Datasources
    class BaseFileStream < Base

      # @param id string
      # @param stream Stream
      # @return Integer bytes streamed
      def stream_resource(id, stream)
        raise 'To be implemented in child classes'
      end

      private_class_method :new

    end
  end
end
