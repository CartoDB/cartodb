# encoding: utf-8
require 'aws-sdk'

module DataRepository
  module Filesystem
    module S3
      class AWSConfigurator
        def initialize(config={})
          @config = config
        end #initialize

        def configure
          AWS.config(
            access_key_id:      access_key_id,
            secret_access_key:  secret_access_key
          )
        end #configure

        private

        attr_reader :config

        def access_key_id
          AWS.config.access_key_id      || get_access_key_id
        end #access_key_id

        def secret_access_key
          AWS.config.secret_access_key  || get_secret_access_key
        end #secret_access_key_id

        def get_access_key_id
          config.fetch(:access_key_id, ENV['AWS_ACCESS_KEY_ID'])
        end #get_access_key_id

        def get_secret_access_key
          config.fetch(:secret_access_key, ENV['AWS_SECRET_ACCESS_KEY'])
        end #get_secret_access_key
      end # AWSConfigurator
    end # S3
  end # Filesystem
end # DataRepository

