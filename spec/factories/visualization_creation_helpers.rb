require_relative '../support/factories/tables'
require 'helpers/unique_names_helper'

include Warden::Test::Helpers
include UniqueNamesHelper
include CartoDB

def app
  CartoDB::Application.new
end

def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

def create_random_table(user, name = unique_name('viz'), privacy = nil)
  options = { user_id: user.id, name: name }
  options.merge!(privacy: privacy) if privacy
  create_table(options)
end

def create_table_with_options(user, headers = { 'CONTENT_TYPE'  => 'application/json' }, options = {})
  privacy = options.fetch(:privacy, UserTable::PRIVACY_PUBLIC)

  name    = unique_name('table')
  payload = {
    name:         name,
    description:  "#{name} description"
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

  BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-75.234375,54.57206166],[4.921875,54.36775852],[7.03125,-0.35156029],[-71.71875,1.75753681],[-75.234375,54.57206166]]]]}'.freeze
  OUTSIDE_BBOX_GEOM = '{"type":"MultiPolygon","coordinates":[[[[-149.4140625,79.74993208],[-139.921875,79.74993208],[-136.0546875,78.13449318],[-148.7109375,78.06198919],[-149.4140625,79.74993208]]]]}'.freeze

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
    build(:carto_layer, kind: kind, options: options, order: order, infowindow: infowindow)
  end

  before(:each) do
    bypass_named_maps
  end

  private

end
