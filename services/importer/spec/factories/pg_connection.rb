require 'pg'
require 'sequel'
require 'json'
require 'yaml'

module CartoDB
  module Importer2
    module Factories
      class PGConnection
        def initialize(options = {})
          @options = read_config.merge(options)
          create_db if options[:create_db]
        end

        def connection
          Sequel.postgres(@options)
        end

        def pg_options
          @options
        end

        private

        def read_config
          begin
            load_from_json
          rescue StandardError
            load_from_yml
          end
        end

        def create_db
          begin
            connection.run("CREATE DATABASE \"#{ @options[:create_db] }\"
            WITH TEMPLATE = template_postgis
            OWNER = #{ @options[:user] }
            ENCODING = 'UTF8'
            CONNECTION LIMIT=-1")
          rescue Sequel::DatabaseError => e
            raise unless e.message =~ /database .* already exists/
          end
          begin
            connection.run("CREATE EXTENSION postgis")
          rescue Sequel::DatabaseError => e
            raise unless e.message =~ /extension \"postgis\" already exists/
          end
        end

        def load_from_json
          json_config = File.join(File.dirname("#{__FILE__}"), 'database.json')
            ::JSON.parse(File.read(json_config)).each_with_object({}){ |(k,v), h|
            h[k.to_sym] = v
          }
        end

        def load_from_yml
          if ENV['RAILS_DATABASE_FILE']
            yml_config = "#{File.dirname(__FILE__)}/../../../../config/#{ENV['RAILS_DATABASE_FILE']}"
          else
            yml_config = "#{File.dirname(__FILE__)}/../../../../config/database.yml"
          end
          yml_config = YAML.safe_load(ERB.new(File.read(yml_config)).result)['test'].transform_keys(&:to_sym)
          yml_config[:user] = yml_config.delete :username
          yml_config[:adapter].sub!('postgresql', 'postgres')
          yml_config
        rescue StandardError
          raise("Configure database settings in RAILS_ROOT/config/database.yml or spec/factories/database.json")
        end
      end
    end
  end
end
