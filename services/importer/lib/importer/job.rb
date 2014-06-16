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
        @schema     = 'cdb_importer'
      end #initalize

      def log(message)
        logger.append(message)
      end #log

      def table_name
        %Q(importer_#{id.gsub(/-/, '')})
      end #table_name

      def db
        @db = Sequel.postgres(pg_options.merge(:after_connect=>(proc do |conn|
          conn.execute('SET search_path TO "$user", public, cartodb')
        end)))
      end #db

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end #qualified_table_name

      def concealed_pg_options
        pg_options.reject { |key, value| key.to_s == 'password' }
      end #concealed_pg_options

      attr_reader :id, :logger, :pg_options, :schema
      attr_accessor :success_status

      private
    end # Job
  end # Importer2
end # CartoDB

