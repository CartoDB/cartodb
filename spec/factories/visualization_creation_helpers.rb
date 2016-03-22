# encoding: utf-8

require_relative '../support/factories/tables'

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

def create_random_table(user, name: "viz#{rand(999)}", privacy: nil)
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

  CARTO_OPTIONS = '{"query":"","opacity":0.99,"auto_bound":false,"interactivity":"cartodb_id","debug":false,' \
                  '"visible":true,"tiler_domain":"localhost.lan","tiler_port":"80","tiler_protocol":"http",' \
                  '"sql_domain":"localhost.lan","sql_port":"80","sql_protocol":"http","extra_params":{' \
                  '"cache_policy":"persist"},"cdn_url":"","tile_style_history":[],"style_version":"2.1.1",' \
                  '"table_name":"districtes_barcelona","user_name":"ethervoid-common",' \
                  '"tile_style":"#districtes_barcelona {\n  polygon-fill:#FF6600;\n  polygon-opacity: 0.7;\n  ' \
                  'line-opacity:1;\n  line-color: #FFFFFF;\n}"}'.freeze

  def create_layer(table_name, user_name, order = 1, kind = 'carto', infowindow = nil)
    options = JSON.parse(CARTO_OPTIONS)
    options["table_name"] = table_name
    options["user_name"] = user_name
    FactoryGirl.build(:layer, kind: kind, options: options, order: order, infowindow: infowindow)
  end

  before(:each) do
    bypass_named_maps
  end

  private

end
