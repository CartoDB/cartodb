# encoding: utf-8
require 'pg'
require 'sequel'
require 'uuidtools'

module CartoDB
  module Importer2
    class Job

      DEFAULT_IMPORT_SCHEMA = 'cdb_importer'

      def initialize(attributes={})
        @id         = attributes.fetch(:id, UUIDTools::UUID.timestamp_create.to_s)
        @logger     = attributes.fetch(:logger, nil)
        # Avoid calling new_logger (and thus, requiring CartoDB::Log) if param comes
        @logger     = new_logger if @logger.nil?
        @pg_options = attributes.fetch(:pg_options, {})
        @schema     = attributes.fetch(:schema, DEFAULT_IMPORT_SCHEMA)
      end

      def new_logger
        CartoDB::Log.new(type: CartoDB::Log::TYPE_DATA_IMPORT)
      end

      def log(message)
        @logger.append(message)
      end

      def table_name
        %Q(importer_#{id.gsub(/-/, '')})
      end

      def db
        @db = Sequel.postgres(pg_options.merge(:after_connect=>(proc do |conn|
          conn.execute('SET search_path TO "$user", public, cartodb')
        end)))
        @db.extension(:connection_validator)
        @db.pool.connection_validation_timeout = pg_options.fetch(:conn_validator_timeout, 900)
        @db
      end

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

      def concealed_pg_options
        pg_options.reject { |key, value| key.to_s == 'password' }
      end

      attr_reader :id, :logger, :pg_options, :schema
      attr_accessor :success_status

      private
    end
  end
end

