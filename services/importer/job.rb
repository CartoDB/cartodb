# encoding: utf-8

module CartoDB
  module Importer
    class Job
      def initialize(attributes={})
        @id         = attributes.fetch(:id)
        @logger     = attributes.fetch(:logger)
        @connection = attributes.fetch(:connection)
        @filepath   = attributes.fetch(:filepath)
      end #initalize

      def log(message)
        logger.append(message)
      end #log

      attr_reader :logger, :id, :connection, :filepath
    end # Job
  end # Importer
end # CartoDB

