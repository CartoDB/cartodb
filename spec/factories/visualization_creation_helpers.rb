# encoding: utf-8

require_relative '../spec_helper'
require_relative './users_helper'
require_relative '../support/factories/tables'
require_relative './database_configuration_contexts'
require_relative './organizations_contexts'

include CartoDB

def app
  CartoDB::Application.new
end

def random_username
  "user#{rand(10000)}"
end

# requires include Warden::Test::Helpers
def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

def create_random_table(user, name = "viz#{rand(999)}", privacy = nil)
  options = { user_id: user.id, name: name }
  options.merge!(privacy: privacy) if privacy
  create_table(options)
end

def create_table_with_options(user, headers = { 'CONTENT_TYPE'  => 'application/json' }, options = {})
  privacy = options.fetch(:privacy, UserTable::PRIVACY_PUBLIC)

  seed    = rand(9999)
  payload = {
    name:         "table #{seed}",
    description:  "table #{seed} description"
  }

  table_attributes = nil
  post_json api_v1_tables_create_url(user_domain: user.username, api_key: user.api_key), payload.to_json, headers do |r|
    table_attributes  = r.body.stringify_keys
    table_id          = table_attributes.fetch('id')

    put api_v1_tables_update_url(id: table_id, user_domain: user.username, api_key: user.api_key),
        { privacy: privacy }.to_json, headers
  end

  table_attributes
end

shared_context 'visualization creation helpers' do
  include Warden::Test::Helpers

  before(:each) do
    bypass_named_maps
  end

  private

end
