module CartoDB
  module PlatformLimits
    module Doubles
      class User
        def initialize(attributes={})
          @username = attributes.fetch(:username, 'wadus')
          @max_import_file_size = attributes.fetch(:max_import_file_size, nil)
        end

        attr_reader :username, :max_import_file_size
      end
    end
  end
end
