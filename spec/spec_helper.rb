# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rspec/rails'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join('spec/support/**/*.rb')].each {|f| require f}

RSpec.configure do |config|
  config.mock_with :mocha

  config.include CartoDB::Factories
  config.include HelperMethods

  config.before(:suite) do
    CartoDB::RedisTest.up
  end

  config.before(:each) do
    Table.any_instance.stubs(:tile_request).returns true
  end

  config.before(:all) do
    $tables_metadata.flushdb
    $api_credentials.flushdb
    $users_metadata.flushdb

    Rails::Sequel.connection.tables.each{ |t| next if [:schema_migrations].include?(t); Rails::Sequel.connection.run("TRUNCATE TABLE \"#{t}\" CASCADE") }
  end

  config.after(:all) do
    # TODO: avoid pool cleanup here and delegate
    #       fine-tuned cleanup to each spec
    #       See https://github.com/CartoDB/cartodb/issues/267
    $pool.close_connections!
    Rails::Sequel.connection[
      "SELECT datname FROM pg_database WHERE datistemplate IS FALSE AND datallowconn IS TRUE AND datname like 'cartodb_test_user_%'"
    ].map(:datname).each { |user_database_name| 
      # If backend termination is needed there is a connection leak
      # (see pool.close_connections call above)
      # See https://github.com/CartoDB/cartodb/issues/267
      #Rails::Sequel.connection.run("SELECT pg_terminate_backend(procpid) FROM pg_stat_activity WHERE datname = '#{user_database_name}'")
      Rails::Sequel.connection.run("drop database #{user_database_name}") 
    }
    Rails::Sequel.connection[
      'SELECT u.usename FROM pg_catalog.pg_user u'
    ].map{ |r| r.values.first }.each { |username| Rails::Sequel.connection.run("drop user \"#{username}\"") if username =~ /^test_cartodb_user_/ }
  end

  config.after(:suite) do
    CartoDB::RedisTest.down
  end

end
