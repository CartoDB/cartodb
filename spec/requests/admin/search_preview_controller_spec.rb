# encoding: utf-8

require_relative '../../spec_helper_min'
require_relative '../../../app/controllers/admin/search_preview_controller'
require 'support/helpers'

describe Carto::Api::TagsController do
  include_context 'users helper'
  include HelperMethods

  before(:all) do
    @headers = { 'CONTENT_TYPE' => 'application/json' }
  end

  describe 'index' do
    before(:each) do
      @mapaza = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_DERIVED,
                                                         user: @carto_user1, name: "mapaza",
                                                         tags: ["owned-tag"])

      table = create_random_table(@user2)
      shared_visualization = table.table_visualization
      shared_visualization.name = "shared_table"
      shared_visualization.tags = ["shared-tag"]
      shared_visualization.save
      shared_entity = CartoDB::SharedEntity.new(
        recipient_id:   @user1.id,
        recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
        entity_id:      shared_visualization.id,
        entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
      )
      shared_entity.save

      @base_url = "#{@user1.username}.localhost.lan"
      host! @base_url
    end

    it 'returns 401 if there is no authenticated user' do
      get_json search_preview_url(q: "tag"), @headers do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'raises a 400 error if types parameter is not valid' do
      login_as(@user1, scope: @user1.username)
      params = { q: "tag", types: "table,wrong" }
      get_json search_preview_url(params), @headers do |response|
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
      get_json search_preview_url(q: "tag", types: "tag"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 2
      end
    end

    it 'returns a 200 response with matching maps' do
      expected_result = [
        { type: "derived", name: "mapaza", url: "http://#{@base_url}:53716/viz/#{@mapaza.id}/map" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json search_preview_url(q: "mapaz", types: "derived"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 1
      end
    end

    it 'returns a 200 response with matching maps, tables and tags' do
      expected_result = [
        { type: "tag", name: "owned-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/owned-tag" },
        { type: "tag", name: "shared-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/shared-tag" },
        { type: "table", name: "shared_table", url: "http://#{@base_url}:53716/tables/shared_table" },
        { type: "derived", name: "mapaza", url: "http://#{@base_url}:53716/viz/#{@mapaza.id}/map" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json search_preview_url(q: "tag", types: "derived,table,tag"), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 4
      end
    end

    it 'allows to limit total results' do
      expected_result = [
        { type: "tag", name: "owned-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/owned-tag" },
        { type: "tag", name: "shared-tag", url: "http://#{@base_url}:53716/dashboard/search/tag/shared-tag" }
      ]

      login_as(@user1, scope: @user1.username)
      get_json search_preview_url(q: "tag", types: "derived,table,tag", limit: 2), @headers do |response|
        expect(response.status).to eq(200)
        expect(response.body[:result]).to eq expected_result
        expect(response.body[:total_count]).to eq 4
      end
    end

  end
end
