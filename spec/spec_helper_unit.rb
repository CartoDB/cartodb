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

  # TODO: some state is leaking at some point in test DB initialization
  config.before(:suite) { purgue_databases }

  config.before { CartoDB::UserModule::DBService.any_instance.stubs(:create_ghost_tables_event_trigger) }

  config.after do
    Delorean.back_to_the_present
    purgue_databases
  end
end
