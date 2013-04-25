# encoding: utf-8
require_relative '../acceptance_helper'

feature 'New users' do
  scenario 'can create a new account'

  scenario 'can create a points table'

  scenario 'can mark a table as public'

  scenario 'can execute a SQL Query against a private table using their API key'

  scenario 'can get a tile with an API key'

  scenario 'can change their password'

  scenario 'can delete their account'
end
