require 'mocha'
require 'mocha/api'
require 'helpers/spec_helper_helpers'
require 'helpers/named_maps_helper'
require 'helpers/unique_names_helper'
require 'database_cleaner/active_record'
require 'support/database_cleaner'
require 'support/message_broker_stubs'
require 'support/shared_entities_spec_helper'

# This file is copied to spec/ when you run 'rails generate rspec:install'
raise %(Cannot run tests in an env other than 'test', RAILS_ENV=#{Rails.env}) unless Rails.env.test?

require File.expand_path('../../config/environment', __FILE__)

# Needed because load order changes in Ruby 2.3+, related to https://github.com/rspec/rspec-rails/pull/1372
# We can remove this if we upgrade to rspec 3+
ActiveRecord.send(:remove_const, :TestFixtures) if ActiveRecord.const_defined?(:TestFixtures)

require 'rspec/rails'
require 'spec_helper_common'

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
  config.include Capybara::DSL
  config.include FactoryBot::Syntax::Methods
  config.include SharedEntitiesSpecHelper
  config.mock_with :mocha

  config.after(:each) do
    Delorean.back_to_the_present
  end

  unless ENV['PARALLEL']
    config.before(:suite) do
      CartoDB::RedisTest.up
    end
  end

  config.before(:all) do
    purgue_databases
    clean_redis_databases unless ENV['PARALLEL']
    CartoDB::UserModule::DBService.any_instance.stubs(:create_ghost_tables_event_trigger)
  end

  config.after(:all) do
    purgue_databases
  end

  unless ENV['PARALLEL'] || ENV['BUILD_ID']
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
  http_json_authorization_headers(Cartodb.get_config(:superadmin, 'username'),
                                  Cartodb.get_config(:superadmin, 'password'))
end

def org_metadata_api_headers
  http_json_authorization_headers(Cartodb.get_config(:org_metadata_api, 'username'),
                                  Cartodb.get_config(:org_metadata_api, 'password'))
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

def post_session(params = {})
  host! "#{params[:user].username}.localhost.lan"

  request_params = { email: params[:user].email, password: params[:password] }
  request_params[:user_domain] = params[:organization].name if params[:organization]

  post(create_session_url(request_params))
end

def parse_set_cookie_header(header)
  kv_pairs = header.split(/\s*;\s*/).map do |attr|
    k, v = attr.split '='
    [ k, v || nil ]
  end
  Hash[ kv_pairs ]
end

def set_cookies_for_next_request(previous_response)
  received_cookies = parse_set_cookie_header(previous_response.headers["Set-Cookie"])
  received_cookies.each { |key, value| cookies[key] = value }
end
