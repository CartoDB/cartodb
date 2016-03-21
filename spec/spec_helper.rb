require_relative './simplecov_helper'
require 'uuidtools'
require_relative './rspec_configuration'
require 'helpers/spec_helper_helpers'
require 'helpers/named_maps_helper'
require 'helpers/random_names_helper'

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

# Inline Resque for queue handling
Resque.inline = true

RSpec.configure do |config|
  config.include SpecHelperHelpers
  config.include CartoDB::Factories
  config.include HelperMethods
  config.include NamedMapsHelper

  unless ENV['PARALLEL']
    config.before(:suite) do
      CartoDB::RedisTest.up
    end
  end

  config.before(:all) do
    unless ENV['PARALLEL']
      clean_redis_databases
      clean_metadata_database
      close_pool_connections
      drop_leaked_test_user_databases
    end

    $user_1 = create_user(quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true, name: 'User 1 Full Name')
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
        close_pool_connections
        drop_leaked_test_user_databases
        delete_database_test_users
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
