# encoding: utf-8

require_relative './spec_helper'
require 'capybara/rails'
require "capybara/dsl"
require "selenium-webdriver"
require "capybara/poltergeist"

# Put your acceptance spec helpers inside /spec/support
require_relative './support/paths'
require_relative './support/acceptance_helpers'
require_relative './support/selenium_find_patch'

Capybara.default_driver     = :selenium
Capybara.default_host       = Cartodb.hostname
Capybara.app_host           = Cartodb.hostname
Capybara.server_port        = 53716
Capybara.default_wait_time  = 5

RSpec.configure do |config|
  config.include Warden::Test::Helpers
  config.include Capybara::DSL, type: :acceptance

  config.before(:each) do
    # Clearing cache makes assets pipeline to compile from scratch all assets, making specs to timeout
    Capybara.reset_sessions!
  end

  config.after(:each) do
    Capybara.use_default_driver
  end
end
