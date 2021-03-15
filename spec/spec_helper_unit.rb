require 'mocha'
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
  config.include FactoryGirl::Syntax::Methods
  config.include SharedEntitiesSpecHelper
  config.mock_with :mocha

  config.after do
    Delorean.back_to_the_present
  end

  config.before(:all) do
    CartoDB::UserModule::DBService.any_instance.stubs(:create_ghost_tables_event_trigger)

    User.each do |user|
      begin
        puts "Closing DB connections: #{user.database_name}"
        user.db_service.reset_pooled_connections
      rescue Sequel::DatabaseError
        nil
      end

      begin
        puts "Removing DB: #{user.database_name}"
        user.db_service.drop_database_and_user
      rescue Sequel::DatabaseConnectionError
        nil
      end
    end

    Carto::FeatureFlagsUser.delete_all
    Carto::FeatureFlag.delete_all
    Carto::OauthToken.delete_all
    Carto::OauthApp.delete_all
    Carto::Map.delete_all
    Carto::Visualization.delete_all
    Carto::UserTable.delete_all
    Carto::User.delete_all
    Carto::SearchTweet.delete_all
    Carto::AccountType.delete_all
    Carto::RateLimit.delete_all
    Carto::ClientApplication.delete_all
    Carto::Organization.delete_all
  end

  config.around do |example|
    DatabaseCleaner[:active_record].strategy = :truncation
    DatabaseCleaner.clean

    example.run
  end
end
