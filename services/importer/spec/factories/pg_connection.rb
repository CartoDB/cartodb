# encoding: utf-8
require 'pg'
require 'sequel'
require 'json'
require 'yaml'

module CartoDB
  module Importer2
    module Factories
      class PGConnection
        def initialize(options = {})
          @options = SequelRails.configuration.environment_for(Rails.env).merge(options)
          create_db if options[:create_db]
        end

        def connection
          Sequel.postgres(@options)
        end

        def pg_options
          @options
        end

        private

        def create_db
          begin
            connection.run("CREATE DATABASE \"#{@options[:create_db]}\"
            WITH TEMPLATE = template_postgis
            OWNER = #{@options[:username]}
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
      end
    end
  end
end
