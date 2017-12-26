# REMOVE THIS FILE WHEN
# http://code.google.com/p/selenium/issues/detail?id=2287
# http://code.google.com/p/selenium/issues/detail?id=2099
# GET FIXED

class Capybara::Selenium::Driver
  def find(selector)
    begin
      browser.find_elements(:xpath, selector).map { |node| Capybara::Selenium::Node.new(self, node) }
    rescue Selenium::WebDriver::Error::InvalidSelectorError, Selenium::WebDriver::Error::UnhandledError
      sleep 1
      browser.find_elements(:xpath, selector).map { |node| Capybara::Selenium::Node.new(self, node) }
    end
  end
end