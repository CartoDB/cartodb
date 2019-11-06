require 'pg'
require 'sequel'
require 'json'

module CartoDB
  module Synchronizer
    module Factories
      class PGConnection
        def initialize
          raise(
            "Please configure your database settings " + 
            "in spec/factories/database.json"
          ) unless File.exists?(configuration_file)

          @pg_options = ::JSON.parse(File.read(configuration_file))
        end

        def connection
          Sequel.postgres(pg_options)
        end

        def pg_options
          Hash[@pg_options.map { |k, v| [k.to_sym, v] }]
        end

        private

        def configuration_file
          File.join(File.dirname("#{__FILE__}"), 'database.json')
        end
      end
    end
  end
end

