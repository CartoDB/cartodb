# encoding: utf-8
require 'forwardable'
require 'json'
require_relative './rdbms'
require_relative './helpers'
require_relative './redis/dumper'

module CartoDB
  module Relocator
    class MetaDumper
      include Helpers
      extend Forwardable

      Relocator::SIMPLE_TABLES.each do |table|
        define_method(table) do 
          serialize(table, transform(records_from(table), 'user_id') )
        end
      end

      def initialize(arguments)
        @user_id        = arguments.fetch(:user_id)
        @relocation     = arguments.fetch(:relocation)
        @rdbms          = arguments.fetch(:rdbms)
        @environment    = arguments.fetch(:environment)
        @redis_dumper   = Redis::Dumper.new
        @metadata       = Hash.new
      end #initialize

      def run
        DATA_SOURCES.each { |table_method| send table_method }
        #}.map { |key, data| serialize(key, data, 'redis') } 
        #metadata.each { |key, data| serialize(key, data) }
      end #run

      def layers
        serialize('layers', rdbms.export_layers_for(user_id))
      end #layers

      def layers_maps
        serialize('layers_maps', rdbms.export_layers_maps_for(user_id))
      end #layers_maps

      def users
        serialize('users', transform(rdbms.export_user(user_id)))
      end #users

      def thresholds
        redis_dumper.tresholds_for(user_id)
      end #thresholds

      def tables_metadata
        redis_dumper.tables_metadata_for(environment.user_database)
      end #table_metadata

      def user_metadata
        username = users.first.fetch('username')
        redis_dumper.user_metadata_for(username)
      end #user_metadata

      def api_credentials
        tokens = []
        redis_dumper.api_credentials_for(tokens)
      end #api_credentials

      private

      attr_reader :rdbms, :user_id, :relocation, :redis_dumper, :metadata

      def records_from(table)
        rdbms.export_records_for(user_id, table)
      end #records_from

      def transform(records, user_id_field=nil)
        records.map do |record|
          record = record.to_hash
          record.store(user_id_field, relocation.token.to_s) if user_id_field
          record
        end
      end #transform

      def serialize(key, data, prefix=nil)
        relocation.store(key, StringIO.new(data.to_json), prefix)
      end #serialize
    end # MetaDumper
  end # Relocator
end # CartoDB

