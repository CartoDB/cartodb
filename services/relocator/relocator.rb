# encoding: utf-8
require_relative '../data-repository/filesystem/s3/backend'
require_relative '../data-repository/filesystem/local'

module CartoDB
  module Relocator
      include DataRepository::Filesystem

      SIMPLE_TABLES     = %w{ api_keys assets client_applications data_imports
                              layers_users maps oauth_tokens tags user_tables }
      COMPLEX_TABLES    = %w{ layers layers_maps users }
      REDIS_DATA        = %w{ tresholds api_credentials tables_metadata
                              user_metadata }
      DATA_SOURCES      = SIMPLE_TABLES + COMPLEX_TABLES
      REDIS_DATABASES   = {
                            tables_metadata:  0,
                            threshold:        2,
                            api_credentials:  3,
                            users_metadata:   5,
                          }
      TMP_DIR           = File.join(File.dirname(__FILE__), '..', '..',
                          'tmp', 'relocator')

      def self.default_local
        Local.new(TMP_DIR)
      end # self.default_local

      def self.default_remote
        S3::Backend.new
      end # self.default_remote
  end # Relocator
end # CartoDB

