# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class User

        DEFAULT_MAX_IMPORT_FILE_SIZE = 150*1024*1024

        def initialize(attributes={})
          @username = attributes.fetch(:username, 'user_mock')
          @max_import_file_size = attributes.fetch(:max_import_file_size, DEFAULT_MAX_IMPORT_FILE_SIZE)
        end

        attr_reader :username, :max_import_file_size
      end
    end
  end
end
