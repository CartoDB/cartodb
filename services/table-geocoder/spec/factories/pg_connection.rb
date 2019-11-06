require 'pg'
require 'sequel'
require 'json'

module CartoDB
  module Importer2
    module Factories
      class PGConnection
        def initialize
          raise(
            "Please configure your database settings " + 
            "in spec/factories/database.json"
          ) unless File.exists?(configuration_file)
          @pg_options = ::JSON.parse(File.read(configuration_file))
          create_db
        end #initialize

        def create_db
          conn = Sequel.postgres(pg_options.reject{|k,v| k == :database})
          begin
            conn.run("CREATE DATABASE \"#{ pg_options[:database] }\"
            WITH TEMPLATE = template_postgis
            OWNER = #{ pg_options[:user] }
            ENCODING = 'UTF8'
            CONNECTION LIMIT=-1")
          rescue Sequel::DatabaseError => e
            raise unless e.message =~ /database .* already exists/
          end
          begin
            conn.run("CREATE EXTENSION postgis")
          rescue Sequel::DatabaseError => e
            raise unless e.message =~ /extension \"postgis\" already exists/
          end
        end

        def connection
          Sequel.postgres(pg_options)
        end #connection

        def pg_options
          Hash[@pg_options.map { |k, v| [k.to_sym, v] }]
        end #pg_options

        private

        def configuration_file
          File.join(File.dirname("#{__FILE__}"), 'database.json')
        end #configuration_file
      end # PGConnection
    end # Factories
  end # Importer2
end # CartoDB

