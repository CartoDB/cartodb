# encoding: utf-8
require 'json'
require_relative './relocator'
require_relative './rdbms'
require_relative './redis/map_style_metadata'
require_relative './redis/user_metadata'
require_relative './redis/threshold_metadata'
require_relative './redis/table_metadata'
require_relative './redis/api_credential_metadata'

Encoding.default_external = "utf-8"

module CartoDB
  module Relocator
    class MetaLoader
      attr_accessor :user, :environment
      
      %w{ maps data_imports client_applications api_keys assets}
      .each do |table|
        define_method(table) { insert_in(table) }
      end

      def initialize(arguments)
        @rdbms      = arguments.fetch(:rdbms)
        @relocation = arguments.fetch(:relocation)
        @renaming   = arguments.fetch(:renaming, false)
      end #initialize

      def run
        @maps_map                 = maps
        @layers_map               = rdbms.insert_layers_for(
                                      records:  records_for(:layers),
                                      user:     user
                                    )
        @data_imports_map         = data_imports
        @client_applications_map  = rdbms.insert_client_applications_for(
                                      records: records_for(:client_applications),
                                      user:     user,
                                      renaming: renaming
                                    )
        api_keys
        assets

        rdbms.insert_oauth_tokens_for(
          user:                     user,
          records:                  records_for(:oauth_tokens),
          client_applications_map:  @client_applications_map,
        )

        rdbms.insert_layers_maps_for(
          records:                  records_for(:layers_maps),
          layers_map:               @layers_map,
          maps_map:                 @maps_map
        )

        rdbms.insert_layers_users_for(
          user:                     user,
          records:                  records_for(:layers_users),
          layers_map:               @layers_map,
        )

        @tables_map = rdbms.insert_user_tables_for(
          user:                     user,
          database_name:            environment.user_database,
          records:                  records_for(:user_tables),
          maps_map:                 @maps_map,
          data_imports_map:         @data_imports_map
        )

        rdbms.insert_tags_for(
          user:                     user,
          records:                  records_for(:tags),
          tables_map:               @tables_map,
        )

        ThresholdMetadata.new(user.id)
          .load(records_for('redis/thresholds_metadata'))
        APICredentialMetadata.new(user.id)
          .load(records_for('redis/api_credentials_metadata'))
        MapStyleMetadata.new(user.id)
          .load(records_for('redis/map_styles_metadata')) 
        TableMetadata.new(user.id)
          .load(records_for('redis/tables_metadata' ))
        UserMetadata.new(user)
          .load(records_for('redis/users_metadata'))
      end #run

      private

      attr_reader :rdbms, :relocation, :renaming

      def insert_in(table_name)
        rdbms.insert_in(table_name, records_for(table_name), user)
      end #insert_in

      def records_for(table_name)
        ::JSON.parse(relocation.fetch(table_name).readlines.join)
      end #records_for
    end # MetaLoader
  end # Relocator
end # CartoDB

