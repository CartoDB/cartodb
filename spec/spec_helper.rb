# Must be placed at the beginning
# @see https://github.com/colszowka/simplecov#getting-started
unless ENV['PARALLEL']
  if ENV['RAILS_ENV'] =~ /^test(.*)?/
    require 'simplecov'
    SimpleCov.start 'rails' do
      # Default is just 10 mins, else will drop "old" coverage data
      merge_timeout 3600
      puts ENV['TEST_ENV_NUMBER']
      command_name "specs_#{Process.pid}"
      add_filter "/spec/"
      add_filter "/tmp/"
      add_filter "/db/"
    end
  end
end

require 'uuidtools'
require_relative './rspec_configuration'

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rspec/rails'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }

# TODO: deprecate and use bypass_named_maps (or viceversa)
def stub_named_maps_calls
  CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true)
end

def random_uuid
  UUIDTools::UUID.timestamp_create.to_s
end

def bypass_named_maps
  CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
  CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true, delete: true)
end

# Inline Resque for queue handling
Resque.inline = true

RSpec.configure do |config|
  config.include CartoDB::Factories
  config.include HelperMethods

  unless ENV['PARALLEL']
    config.before(:suite) do
      CartoDB::RedisTest.up
    end
  end

  config.before(:all) do
    unless ENV['PARALLEL']
      $tables_metadata.flushdb
      $api_credentials.flushdb
      $users_metadata.flushdb

      protected_tables = [:schema_migrations, :spatial_ref_sys]
      Rails::Sequel.connection.tables.each do |t|
        if !protected_tables.include?(t)
          begin
            Rails::Sequel.connection.run("TRUNCATE TABLE \"#{t}\" CASCADE")
          rescue Sequel::DatabaseError => e
            raise e unless e.message =~ /PG::Error: ERROR:  relation ".*" does not exist/
          end
        end
      end

      # To avoid Travis and connection leaks
      $pool.close_connections!
      Rails::Sequel.connection[
        "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
      ].map(:datname).each { |user_database_name|
        puts "Dropping leaked test database #{user_database_name}"
        CartoDB::UserModule::DBService.terminate_database_connections(
          user_database_name, ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
        )
        Rails::Sequel.connection.run("drop database \"#{user_database_name}\"")
      }
    end

    $user_1 = create_user(quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true)
    $user_2 = create_user(quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true)
  end

  config.after(:all) do
    unless ENV['PARALLEL']
      begin
        stub_named_maps_calls
        delete_user_data($user_1)
        delete_user_data($user_2)
        $user_1.destroy
        $user_2.destroy
      ensure
        $pool.close_connections!
        Rails::Sequel.connection[
          "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
        ].map(:datname).each { |user_database_name|
          puts "Dropping leaked test database #{user_database_name}"
          CartoDB::UserModule::DBService.terminate_database_connections(
            user_database_name, ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
          )
          Rails::Sequel.connection.run("drop database \"#{user_database_name}\"")
        }
        Rails::Sequel.connection[
          'SELECT u.usename FROM pg_catalog.pg_user u'
        ].map { |r| r.values.first }.each { |username| Rails::Sequel.connection.run("drop user \"#{username}\"") if username =~ /^test_cartodb_user_/ }
      end
    else
      stub_named_maps_calls
      delete_user_data($user_1)
      delete_user_data($user_2)
      $user_1.destroy
      $user_2.destroy
    end
  end

  unless ENV['PARALLEL']
    config.after(:suite) do
      CartoDB::RedisTest.down
    end
  end

  module Rack
    module Test
      module Methods
        def build_rack_mock_session
          Rack::MockSession.new(app, host)
        end

        def with_host(temp_host)
          old_host = host
          host! temp_host
          yield
        ensure
          host! old_host
        end
      end
    end
  end
end

def superadmin_headers
  http_json_authorization_headers(Cartodb.config[:superadmin]["username"],
                                  Cartodb.config[:superadmin]["password"])
end

def org_metadata_api_headers
  http_json_authorization_headers(Cartodb.config[:org_metadata_api]["username"],
                                  Cartodb.config[:org_metadata_api]["password"])
end

def http_json_authorization_headers(user, password)
  http_json_headers.merge(
    "HTTP_AUTHORIZATION" => ActionController::HttpAuthentication::Basic.encode_credentials(user, password),
    "HTTP_ACCEPT" => "application/json")
end

def http_json_headers
  { "CONTENT_TYPE" => "application/json", :format => "json" }
end
