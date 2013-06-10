# encoding: utf-8
require 'uuidtools'
require_relative '../track_record/track_record'

module CartoDB
  module Importer
    class Job
      def initialize(attributes={})
        @id         = attributes.fetch(:id, UUIDTools::UUID.timestamp_create)
        @logger     = attributes.fetch(:logger, TrackRecord::Log.new)
        @pg_options = attributes.fetch(:pg_options, {})
        @filepath   = attributes.fetch(:filepath)
      end #initalize

      def log(message)
        logger.append(message)
      end #log

      attr_reader :logger, :id, :connection, :filepath, :pg_options
    end # Job
  end # Importer
end # CartoDB

