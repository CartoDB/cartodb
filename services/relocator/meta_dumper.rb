# encoding: utf-8
require 'forwardable'
require 'json'
require_relative './rdbms'
require_relative './helpers'
require_relative './redis/dumper'
require_relative './redis/map_style_metadata'

module CartoDB
  module Relocator
    class MetaDumper
      include Helpers
      extend Forwardable

      Relocator::SIMPLE_TABLES.each do |table|
        define_method(table) do 
          memoize(table, transform(records_from(table), 'user_id') )
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
        TABLES.each     { |table| serialize(table, send(table)) }
        REDIS_DATA.each { |sink| serialize(sink, send(sink), 'redis')}
      end #run

      def layers
        memoize('layers', rdbms.export_layers_for(user_id))
      end #layers

      def layers_maps
        memoize('layers_maps', rdbms.export_layers_maps_for(user_id))
      end #layers_maps

      def users
        memoize('users', transform(rdbms.export_user(user_id)))
      end #users

      def thresholds_metadata
        memoize('thresholds_metadata', redis_dumper.thresholds_for(user_id))
      end #thresholds_metadata

      def tables_metadata
        database = environment.user_database
        memoize('tables_metadata', redis_dumper.tables_metadata_for(database))
      end #tables_metadata

      def users_metadata
        username = users.first.fetch('username')
        memoize('users_metadata', redis_dumper.user_metadata_for(username))
      end #users_metadata

      def api_credentials_metadata
        tokens = oauth_tokens.map { |oauth_token| oauth_token.fetch('token') }
        memoize(
          'api_credentials_metadata', redis_dumper.api_credentials_for(tokens)
        )
      end #api_credentials_metadata

      def map_styles_metadata
        memoize('map_styles_metadata', MapStyleMetadata.new(user_id).dump)
      end #map_styles_metadata

      private

      attr_reader :rdbms, :user_id, :relocation, :redis_dumper, :metadata,
                  :environment

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

      def memoize(key, data)
        metadata.fetch(key, metadata.store(key, data))
      end #memoize

      def serialize(key, data, prefix=nil)
        relocation.store(key, StringIO.new(data.to_json), prefix)
      end #serialize
    end # MetaDumper
  end # Relocator
end # CartoDB

