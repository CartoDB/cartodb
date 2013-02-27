# encoding: utf-8
require 'json'
require_relative '../../../services/data-repository/filesystem/local'

module CartoDB
  module Relocator
    class MetaDumper
      def initialize(arguments)
        @connection = arguments.fetch(:connection)
        @user_id    = arguments.fetch(:user_id)
        @token      = arguments.fetch(:token)
        @filesystem = arguments.fetch(:filesystem, default_filesystem)
      end #initialize

      def simple_query(table)
        dump("
          SELECT *  FROM #{table}
          WHERE     user_id = #{user_id}
        ", 'user_id', table)
      end #simple_query

      def api_keys
        simple_query(__method__)
      end #api_keys

      def assets
        simple_query(__method__)
      end #assets

      def client_applications
        simple_query(__method__)
      end #client_applications

      def data_imports
        simple_query(__method__)
      end #data_imports

      def layers
        data = connection.execute("
          SELECT    layers.id, layers.options, layers.kind, layers.infowindow,
                    layers.order, layers.updated_at
          FROM      layers, layers_users
          WHERE     layers_users.user_id = #{user_id}
          GROUP BY  layers.id
        ").map(&:to_hash)

        save(__method__, data)
      end #layers

      def layers_maps
        data = connection.execute("
          SELECT    layers_maps.id, layer_id, map_id 
          FROM      layers_maps, maps 
          WHERE     maps.user_id = #{user_id} 
          GROUP BY  layers_maps.id
        ").map(&:to_hash)
        save(__method__, data)
      end #layers_maps

      def layers_users
        simple_query(__method__)
      end #layers_users

      def users
        dump("
          SELECT  * 
          FROM    users
          WHERE   id = #{user_id}
        ", 'id', __method__)
      end #users

      def maps
        simple_query(__method__)
      end #maps

      def oauth_tokens
        simple_query(__method__)
      end #oauth_tokens

      def user_tables
        simple_query(__method__)
      end #user_tables

      private

      attr_reader :connection, :user_id, :token, :filesystem

      def dump(sql_query, user_id_field, table_name)
        save(table_name, query(sql_query, user_id_field))
      end #dump

      def query(sql_query, user_id_field)
        connection.execute(sql_query) do |result| 
          transform(result, user_id_field)
        end
      end #query

      def transform(records, user_id_field)
        records.map { |record|
          record = record.to_hash
          record.store(user_id_field, token.to_s)
          record.delete('id')
          record
        }
      end #transform

      def save(table_name, records)
        json_data = StringIO.new(records.to_json)
        filesystem.store("#{table_name}.json", json_data)
      end #save

      def default_filesystem
        DataRepository::Filesystem::Local.new("/var/tmp/#{token}")
      end #default_filesystem
    end # MetaDumper
  end # Relocator
end # CartoDB

