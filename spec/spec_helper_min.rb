# This file provides a minimal Rails integration test environment with an empty database, without users.
require 'mocha'
require 'simplecov_helper'
require 'helpers/spec_helper_helpers'
require 'helpers/named_maps_helper'
require './spec/support/message_broker_stubs'
require './spec/support/redis'
require './spec/support/shared_entities_spec_helper'

raise %(Cannot run tests in an env other than 'test', RAILS_ENV=#{Rails.env}) unless Rails.env.test?

# INFO: this is the only slow step of the test boot process
require File.expand_path('../../config/environment', __FILE__)

# Needed because load order changes in Ruby 2.3+, related to https://github.com/rspec/rspec-rails/pull/1372
# We can remove this if we upgrade to rspec 3+
ActiveRecord.send(:remove_const, :TestFixtures) if ActiveRecord.const_defined?(:TestFixtures)

require 'rspec/rails'
require 'spec_helper_common'

Resque.inline = true

# host_validation is set to support `example.com` emails in specs
# in production we do check for the existance of mx records associated to the domain
EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)

RSpec.configure do |config|
  config.include SpecHelperHelpers
  config.include NamedMapsHelper
  config.include Capybara::DSL
  config.include FactoryGirl::Syntax::Methods
  config.include SharedEntitiesSpecHelper
  config.mock_with :mocha

  config.after do
    Delorean.back_to_the_present
  end

  config.before(:all) do
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
end
