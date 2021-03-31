require_relative '../../../spec_helper_min'
require_relative '../../../../app/controllers/carto/api/search_preview_controller'
require 'support/helpers'

describe Carto::Api::TagsController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  describe 'index' do
    before(:each) do
      @mapaza = create(:carto_visualization, type: Carto::Visualization::TYPE_DERIVED,
                                                         user: @carto_user1, name: "mapaza",
                                                         tags: ["owned-tag", "map"])

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

      @base_url = "#{@user1.username}.localhost.lan"
      host! @base_url
    end

    it 'returns 401 if there is no authenticated user' do
      get_json api_v3_search_preview_url(q: "tag"), @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'raises a 400 error if types parameter is not valid' do
      login_as(@user1, scope: @user1.username)
      params = { q: "tag", types: "table,wrong" }
      get_json api_v3_search_preview_url(params), @headers do |response|
        expect(response.status).to eq(400)
        expect(response.body[:errors]).to include("parameter combination")
      end
    end

    it 'returns a 200 response with matching tags' do
      expected_result = [
        { type: "tag", name: "owned-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/owned-tag" },
        { type: "tag", name: "shared-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/shared-tag" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json api_v3_search_preview_url(q: "tag", types: "tag"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to match_array(expected_result)
        expect(response.body[:total_count]).to eq 2
      end
    end

    it 'returns a 200 response with matching maps' do
      expected_result = [
        { type: "derived", name: "mapaza", url: "http://#{@base_url}:53716/viz/#{@mapaza.id}/map" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json api_v3_search_preview_url(q: "mapaza", types: "derived"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 1
      end
    end

    it 'returns a 200 response with matching maps and tags' do
      expected_result = [
        { type: "tag", name: "map", url: "http://#{@base_url}:53716/dashboard/search/tag/map" },
        { type: "derived", name: "mapaza", url: "http://#{@base_url}:53716/viz/#{@mapaza.id}/map" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json api_v3_search_preview_url(q: "map", types: "derived,tag"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 2
      end
    end

  end
end
