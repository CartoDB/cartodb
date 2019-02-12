# encoding: utf-8

require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/tags_controller'

describe Carto::Api::TagsController do
  include_context 'user helper'
  include HelperMethods

  before(:all) do
    @params = { user_domain: @user.username, api_key: @user.api_key }
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  describe 'index' do
    it 'returns 401 if there is no authenticated user' do
      get_json api_v3_users_tags_url, @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'returns a 200 response with the current user tags' do
      FactoryGirl.create(:derived_visualization, user_id: @user.id, tags: ["etiqueta"])
      expected_tags = [{ tag: "etiqueta", maps: 1, datasets: 0, data_library: 0 }]

      get_json api_v3_users_tags_url(@params), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_tags
        expect(response.body[:total]).to eq 1
        expect(response.body[:count]).to eq 1
      end
    end
  end
end
