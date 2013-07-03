# encoding: utf-8
require 'pg'
require 'sequel'
require 'uuidtools'
require_relative '../../../track_record/track_record'

module CartoDB
  module Importer2
    class Job
      def initialize(attributes={})
        @id         = attributes.fetch(:id, UUIDTools::UUID.timestamp_create.to_s)
        @logger     = attributes.fetch(:logger, TrackRecord::Log.new)
        @pg_options = attributes.fetch(:pg_options, {})
      end #initalize

      def log(message)
        logger.append(message)
      end #log

      def table_name
        "importer_#{id.gsub(/-/, '')}"
      end #table_name

      def db
        @db ||= Sequel.postgres(pg_options)
      end #db

      def dataset
        db[table_name.to_sym]
      end #dataset

      attr_reader :id, :logger, :pg_options
    end # Job
  end # Importer2
end # CartoDB

