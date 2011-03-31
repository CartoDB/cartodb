require File.expand_path(File.dirname(__FILE__) + "/../spec_helper")
require "steak"
require 'capybara/rails'
require "capybara/dsl"
require "selenium-webdriver"

# Put your acceptance spec helpers inside /spec/acceptance/support
Dir["#{File.dirname(__FILE__)}/support/**/*.rb"].each {|f| require f}

Capybara.default_driver    = :selenium
Capybara.default_wait_time = 10
Capybara.default_host      = APP_CONFIG[:app_host]
Capybara.app_host          = APP_CONFIG[:app_host]
Capybara.server_port       = 53716
Capybara.register_driver :selenium do |app| 
  Capybara::Driver::Selenium.new(app, :browser => :chrome) 
end

RSpec.configure do |config|
  config.include Warden::Test::Helpers
  config.include Capybara, :type => :acceptance

  config.before(:each) do
    Rails.cache.clear
  end

  config.after(:each) do
    case page.driver.class
    when Capybara::Driver::RackTest
      page.driver.rack_mock_session.clear_cookies
    when Capybara::Driver::Selenium
      page.driver.cleanup!
    end
    Capybara.use_default_driver
  end
end