require_relative './simplecov_helper'
require_relative './rspec_configuration'
require 'helpers/spec_helper_helpers'
require 'helpers/named_maps_helper'
require 'helpers/unique_names_helper'

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)

# Needed because load order changes in Ruby 2.3+, related to https://github.com/rspec/rspec-rails/pull/1372
# We can remove this if we upgrade to rspec 3+
ActiveRecord.send(:remove_const, :TestFixtures) if ActiveRecord.const_defined?(:TestFixtures)

require 'rspec/rails'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join('spec/support/**/*.rb')].each { |f| require f }

# Inline Resque for queue handling
Resque.inline = true

# host_validation is set to support `example.com` emails in specs
# in production we do check for the existance of mx records associated to the domain
EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)

RSpec.configure do |config|
  config.include SpecHelperHelpers
  config.include CartoDB::Factories
  config.include HelperMethods
  config.include NamedMapsHelper

  config.after(:each) do
    Delorean.back_to_the_present
  end

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

    CartoDB::UserModule::DBService.any_instance.stubs(:configure_ghost_table_event_trigger).returns(true)
  end

  config.after(:all) do
    unless ENV['PARALLEL']
      close_pool_connections
      drop_leaked_test_user_databases
      delete_database_test_users
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

def fake_data_path(filename)
  Rails.root.join("db/fake_data/#{filename}").to_s
end

def login_page_response?(response)
  response.status == 200 && response.body.include?("title=\"Email or username\"")
end
