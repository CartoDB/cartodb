# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.mock_with :mocha

  config.include CartoDB::Factories
  config.include HelperMethods

  config.before(:suite) do
    CartoDB::RedisTest.up
  end

  config.before(:all) do
    $tables_metadata.flushdb
    $api_credentials.flushdb
    $users_metadata.flushdb

    Rails::Sequel.connection.tables.each{ |t| next if [:schema_migrations].include?(t); Rails::Sequel.connection.run("TRUNCATE TABLE #{t} CASCADE") }
  end

  config.after(:all) do
    $pool.close_connections!
  end

  config.after(:suite) do
    CartoDB::RedisTest.down
  end

end
