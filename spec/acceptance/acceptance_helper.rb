require File.expand_path(File.dirname(__FILE__) + "/../spec_helper")
require "steak"
require 'capybara/rails'
require "capybara/dsl"
require "selenium-webdriver"

# Put your acceptance spec helpers inside /spec/acceptance/support
Dir["#{File.dirname(__FILE__)}/support/**/*.rb"].each {|f| require f}

Capybara.default_driver    = :selenium
Capybara.default_wait_time = 10
Capybara.default_host      = CartoDB.hostname
Capybara.app_host          = CartoDB.hostname
Capybara.server_port       = 53716
# Capybara.register_driver :selenium do |app|
#   Capybara::Driver::Selenium.new(app, :browser => :chrome)
# end

RSpec.configure do |config|
  config.include Warden::Test::Helpers
  config.include Capybara::DSL, :type => :acceptance

  config.before(:each) do
    Rails.cache.clear
    Capybara.reset_sessions! 
  end

  config.after(:each) do
    Capybara.use_default_driver
  end
end