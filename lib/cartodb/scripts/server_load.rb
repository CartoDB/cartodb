require 'capybara'
require 'capybara/dsl'

class ServerLoadScript
    include Capybara::DSL

  def initialize

    Capybara.default_driver = :selenium
    Capybara.app_host       = 'https://staging20.carto.com'
    Capybara.run_server     = false

    visit '/'

  end

end
