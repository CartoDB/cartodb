require_relative '../../../spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/tags_controller'

describe Carto::Api::TagsController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @params = { user_domain: @user1.username, api_key: @user1.api_key, types: "derived,table" }
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  describe 'index' do
    before(:each) do
      create(:derived_visualization, user_id: @user1.id, tags: ["owned-tag"])

      table = create_random_table(@user2)
      shared_visualization = table.table_visualization
      shared_visualization.tags = ["shared-tag"]
      shared_visualization.save
      Carto::SharedEntity.create(
        recipient_id: @user1.id,
        recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id: shared_visualization.id,
        entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
    end

    it 'returns 401 if there is no authenticated user' do
      get_json api_v3_users_tags_url, @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'raises a 400 error if types parameter is not valid' do
      params = @params.merge(types: "table,wrong")
      get_json api_v3_users_tags_url(params), @headers do |response|
        expect(response.status).to eq(400)
      end
    end

    it 'returns a 200 response with the tags owned by the current user' do
      expected_tags = [{ tag: "owned-tag", maps: 1, datasets: 0 }]

      get_json api_v3_users_tags_url(@params), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_tags
        expect(response.body[:total]).to eq 1
        expect(response.body[:count]).to eq 1
      end
    end

    it 'returns a 200 response with the tags owned or shared by the current user' do
      expected_tags = [
        { tag: "owned-tag", maps: 1, datasets: 0 },
        { tag: "shared-tag", maps: 0, datasets: 1 }
      ]
      shared_params = @params.merge(include_shared: "true")

      get_json api_v3_users_tags_url(shared_params), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to match_array(expected_tags)
        expect(response.body[:total]).to eq 2
        expect(response.body[:count]).to eq 2
      end
    end

    it 'returns a 200 response with filtered tags' do
      create(:table_visualization, user_id: @user1.id, tags: ["otra"])
      expected_tags = [{ tag: "otra", maps: 0, datasets: 1 }]
      search_params = @params.merge(q: "otra")

      get_json api_v3_users_tags_url(search_params), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_tags
        expect(response.body[:total]).to eq 1
        expect(response.body[:count]).to eq 1
      end
    end
  end
end
