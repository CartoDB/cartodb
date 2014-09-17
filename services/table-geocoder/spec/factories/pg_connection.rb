# encoding: utf-8
require 'pg'
require 'sequel'
require 'json'
require 'yaml'
require 'active_support/core_ext'

module CartoDB
  module Importer2
    module Factories
      class PGConnection
        def initialize(options = {})
          @options = options.reverse_merge(read_config)
          create_db if options[:create_db]
        end #initialize

        def connection
          Sequel.postgres(@options)
        end #connection

        private
        def read_config
          begin
            load_from_json
          rescue
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
          json_config = ::JSON.parse(File.read(json_config)).symbolize_keys
          json_config
        end

        def load_from_yml
          yml_config = "#{File.dirname(__FILE__)}/../../../../config/database.yml"
          yml_config = YAML.load_file(yml_config)['test'].symbolize_keys
          yml_config[:user] = yml_config.delete :username
          yml_config
        rescue
          raise(
            "Please configure your database settings " +
            "in RAILS_ROOT/config/database.yml "+
            "or spec/factories/database.json"
          )
        end
      end # PGConnection
    end # Factories
  end # Importer2
end # CartoDB