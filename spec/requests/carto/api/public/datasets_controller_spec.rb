require 'spec_helper_min'
require 'support/helpers'
require 'factories/organizations_contexts'

describe Carto::Api::Public::DatasetsController do
  include_context 'users helper'
  include_context 'organization with users helper'

  include HelperMethods

  describe 'index' do
    before(:each) do
      @params = { api_key: @user1.api_key, page: 1, per_page: 10 }

      create(:table, user_id: @user1.id, name: 'table-a')
      create(:table, user_id: @user1.id, name: 'table-b')
      create(:table, user_id: @user1.id, name: 'table-c')

      host! "#{@user1.username}.localhost.lan"
    end

    it 'returns 200 with the user tables' do
      get_json api_v4_datasets_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 3
        expect(response.body[:count]).to eq 3
        expect(response.body[:result][0][:name]).to eq 'table_a'
        expect(response.body[:result][0][:mode]).to eq 'rw'
        expect(response.body[:result][0][:privacy]).to eq 'private'
        expect(response.body[:result][0][:cartodbfied]).to eq true
        expect(response.body[:result][0][:updated_at]).to_not be_nil
        expect(response.body[:result][0][:table_schema]).to eq @user1.database_schema
        expect(response.body[:result][0][:shared]).to eq false

      end
    end

    it 'includes non-cartodbfied tables' do
      @user1.in_database.execute('CREATE TABLE non_cartodbfied_table()')

      get_json api_v4_datasets_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 4
        expected_dataset = {
          name: 'non_cartodbfied_table',
          mode: 'rw',
          privacy: nil,
          cartodbfied: false,
          updated_at: nil,
          table_schema: @user1.database_schema,
          shared: false
        }
        expect(response.body[:result][0]).to eq expected_dataset
      end

      @user1.in_database.execute('DROP TABLE non_cartodbfied_table')
    end

    it 'includes views' do
      @user1.in_database.execute('CREATE VIEW my_view AS SELECT 5')

      get_json api_v4_datasets_url(@params) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 4
        expect(response.body[:result][0][:name]).to eq 'my_view'
        expect(response.body[:result][0][:mode]).to eq 'rw'
        expect(response.body[:result][0][:privacy]).to be_nil
        expect(response.body[:result][0][:cartodbfied]).to eq false
        expect(response.body[:result][0][:updated_at]).to be_nil
        expect(response.body[:result][0][:table_schema]).to eq @user1.database_schema
        expect(response.body[:result][0][:shared]).to eq false
      end

      @user1.in_database.execute('DROP VIEW my_view')
    end

    context 'shared datasets' do

      before(:each) do
        host! "#{@org_user_2.username}.localhost.lan"
        @table_name = 'shared_table'
        @params = { api_key: @org_user_2.api_key, page: 1, per_page: 10 }
        @shared_table = create(:table, user_id: @org_user_1.id, name: @table_name )
      end

      it 'includes shared datasets read only' do
        share_table_with_user(@shared_table, @org_user_2, access: Carto::Permission::ACCESS_READONLY)

        get_json api_v4_datasets_url(@params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 1
          expect(response.body[:result][0][:name]).to eq @table_name
          expect(response.body[:result][0][:mode]).to eq 'r'
          expect(response.body[:result][0][:privacy]).to eq 'private'
          expect(response.body[:result][0][:cartodbfied]).to eq true
          expect(response.body[:result][0][:table_schema]).to eq @org_user_1.database_schema
          expect(response.body[:result][0][:shared]).to eq true
        end
      end

      it 'includes shared datasets read and write' do
        share_table_with_user(@shared_table, @org_user_2, access: Carto::Permission::ACCESS_READWRITE)

        get_json api_v4_datasets_url(@params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 1
          expect(response.body[:result][0][:name]).to eq @table_name
          expect(response.body[:result][0][:mode]).to eq 'rw'
          expect(response.body[:result][0][:privacy]).to eq 'private'
          expect(response.body[:result][0][:cartodbfied]).to eq true
          expect(response.body[:result][0][:table_schema]).to eq @org_user_1.database_schema
          expect(response.body[:result][0][:shared]).to eq true
        end
      end
    end

    it 'returns 200 with an empty array if the current user does not have datasets' do
      @user3 = create(:valid_user)
      host! "#{@user3.username}.localhost.lan"

      get_json api_v4_datasets_url(api_key: @user3.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total]).to eq 0
        expect(response.body[:count]).to eq 0
        expect(response.body[:result]).to be_empty
      end
    end

    context 'permissions' do
      it 'returns 401 if there is no authenticated user' do
        get_json api_v4_datasets_url do |response|
          expect(response.status).to eq(401)
        end
      end

      it 'returns 403 when using a regular API key without datasets:metadata scope' do
        api_key = create(:api_key_apis, user_id: @user1.id)

        get_json api_v4_datasets_url(@params.merge(api_key: api_key.token)) do |response|
          expect(response.status).to eq(403)
        end
      end

      it 'returns 200 when using a API key with datasets:metadata scope' do
        api_key = create(:oauth_api_key_datasets_metadata_grant, user_id: @user1.id)

        get_json api_v4_datasets_url(@params.merge(api_key: api_key.token)) do |response|
          expect(response.status).to eq(200)
        end
      end

      context 'with engine disabled' do
        before(:each) do
          @user1.engine_enabled = false
          @user1.save
        end

        after(:each) do
          @user1.engine_enabled = true
          @user1.save
        end

        it 'returns 404' do
          get_json api_v4_datasets_url(@params) do |response|
            expect(response.status).to eq(404)
          end
        end
      end
    end

    context 'pagination' do
      it 'paginates the results' do
        get_json api_v4_datasets_url(@params.merge(page: 2, per_page: 1)) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 3
          expect(response.body[:count]).to eq 1
          expect(response.body[:result][0][:name]).to eq 'table_b'
        end
      end

      it 'returns the expected links' do
        base_url = "http://#{@user1.username}.localhost.lan/api/v4/datasets?api_key=#{@user1.api_key}&format=json"
        get_json api_v4_datasets_url(@params.merge(page: 1, per_page: 1)) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:_links][:first][:href]).to eq "#{base_url}&page=1&per_page=1"
          expect(response.body[:_links][:next][:href]).to eq "#{base_url}&page=2&per_page=1"
          expect(response.body[:_links][:last][:href]).to eq "#{base_url}&page=3&per_page=1"
        end
      end
    end

    context 'ordering' do
      it 'orders results by name ascending by default' do
        get_json api_v4_datasets_url(@params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 3
          expect(response.body[:count]).to eq 3
          expect(response.body[:result][0][:name]).to eq 'table_a'
          expect(response.body[:result][1][:name]).to eq 'table_b'
        end
      end

      it 'orders results by name descending' do
        get_json api_v4_datasets_url(@params.merge(order_direction: 'desc')) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:total]).to eq 3
          expect(response.body[:count]).to eq 3
          expect(response.body[:result][0][:name]).to eq 'table_c'
          expect(response.body[:result][1][:name]).to eq 'table_b'
        end
      end

      it 'returns 400 if the ordering param is invalid' do
        get_json api_v4_datasets_url(@params.merge(order: 'wadus')) do |response|
          expect(response.status).to eq(400)
          expect(response.body[:errors]).to include "Wrong 'order' parameter value"
        end
      end
    end
  end
end
