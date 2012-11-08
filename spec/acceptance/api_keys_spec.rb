# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "API keys" do

  scenario 'can be generated through the UI'

  scenario '(oAuth) can be generated through the UI'

  scenario 'allows users to perform SQL queries to private tables using the newest API key'

  scenario 'does not allow users to perform SQL queries to private tables using an old API key'

  scenario 'allows users to get a tile from a private table using the newest API key'

  scenario 'does not allow users to get a tile from a private table using an old API key'

end
