# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class User

        DEFAULT_MAX_IMPORT_FILE_SIZE = 150*1024*1024
        DEFAULT_MAX_IMPORT_TABLE_ROW_COUNT = 500*1000
        DEFAULT_DATABASE_TIMEOUT = 300000

        def initialize(attributes={})
          @username = attributes.fetch(:username, 'user_mock')
          @api_key = attributes.fetch(:api_key, 'api_key_mock')
          @max_import_file_size = attributes.fetch(:max_import_file_size, DEFAULT_MAX_IMPORT_FILE_SIZE)
          @max_import_table_row_count = attributes.fetch(:max_import_table_row_count, DEFAULT_MAX_IMPORT_TABLE_ROW_COUNT)
          @database_timeout = attributes.fetch(:database_timeout, DEFAULT_DATABASE_TIMEOUT)
        end

        attr_reader :username, :api_key, :max_import_file_size, :max_import_table_row_count, :database_timeout
      end
    end
  end
end
