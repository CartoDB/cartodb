require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'
require_relative '../../../../app/controllers/carto/api/visualizations_controller'

# TODO: Remove once Carto::Visualization is complete enough
require_relative '../../../../app/models/visualization/member'
require_relative './vizjson_shared_examples'
require_relative './helpers/visualization_controller_helper'
require 'helpers/unique_names_helper'
require_dependency 'carto/uuidhelper'
require 'factories/carto_visualizations'
require 'helpers/visualization_destruction_helper'
require 'helpers/feature_flag_helper'

include Carto::UUIDHelper

describe Carto::Api::VisualizationsController do
  include UniqueNamesHelper
  include Carto::Factories::Visualizations
  include VisualizationDestructionHelper
  include FeatureFlagHelper
  include VisualizationControllerHelper

  before(:all) do
    create_account_type_fg('ORGANIZATION USER')
  end

  describe 'index' do
    include_context 'visualization creation helpers'

    before(:all) do
      @headers = {'CONTENT_TYPE'  => 'application/json'}
    end

    before(:each) do
      @user = create(:valid_user)
      login(@user)
    end

    after(:each) do
      @user.destroy
    end

    it 'mixed types search should filter only remote without display name' do
      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'table').to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', name: 'visu2', display_name: 'visu2').to_json, @headers
      vis_2_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_2_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 200).save

      post api_v1_visualizations_create_url(api_key: @user.api_key),
           factory(@user, locked: true, type: 'remote', name: 'visu3').to_json, @headers
      vis_3_id = JSON.parse(last_response.body).fetch('id')
      Carto::ExternalSource.new(
        visualization_id: vis_3_id,
        import_url: 'http://www.fake.com',
        rows_counted: 1,
        size: 200).save

      get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'remote,table'), {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 2
      [vis_1_id, vis_2_id].include?(collection[0]['id']).should eq true
      [vis_1_id, vis_2_id].include?(collection[1]['id']).should eq true
    end

    context 'with_dependent_visualizations' do
      before(:each) do
        Delorean.time_travel_to "2018/01/01 00:00:00" do
          _, table = create_full_visualization(@user)

          @dependencies = Array.new(2) do
            Delorean.jump(1.day)
            _, _, _, visualization = create_full_visualization(@user, table: table)
            visualization
          end
        end
      end

      it 'does not return the dependent visualizations by default' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table', order: 'dependent_visualizations'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should be_nil
        collection[0]['dependent_visualizations'].should be_nil
      end

      it 'does not return the dependent visualizations if with_dependent_visualizations = 0' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                            with_dependent_visualizations: 0), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should be_nil
        collection[0]['dependent_visualizations'].should be_nil
      end

      it 'returns the 2 most recent dependent visualizations when with_dependent_visualizations = 2' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                            with_dependent_visualizations: 2), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 1
        collection[0]['dependent_visualizations_count'].should eql 3
        collection[0]['dependent_visualizations'].length.should eq 2
        collection[0]['dependent_visualizations'].first['id'].should eql @dependencies[1].id
        collection[0]['dependent_visualizations'].first['name'].should_not be_nil
        collection[0]['dependent_visualizations'].second['id'].should eql @dependencies[0].id
        collection[0]['dependent_visualizations'].second['name'].should_not be_nil
      end

      context 'with faster dependencies' do
        before(:all) do
          @feature_flag = create(:feature_flag, name: 'faster-dependencies', restricted: true)
        end

        after(:all) do
          @feature_flag.destroy
        end

        it 'does not return the dependent visualizations by default' do
          with_feature_flag(@user, 'faster-dependencies', true) do
            get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                                order: 'dependent_visualizations'), {}, @headers
          end

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 1
          collection[0]['dependent_visualizations_count'].should be_nil
          collection[0]['dependent_visualizations'].should be_nil
        end

        it 'does not return the dependent visualizations if with_dependent_visualizations = 0' do
          with_feature_flag(@user, 'faster-dependencies', true) do
            get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                                with_dependent_visualizations: 0), {}, @headers
          end

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 1
          collection[0]['dependent_visualizations_count'].should be_nil
          collection[0]['dependent_visualizations'].should be_nil
        end

        it 'returns the 2 most recent dependent visualizations when with_dependent_visualizations = 2' do
          with_feature_flag(@user, 'faster-dependencies', true) do
            get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table',
                                                with_dependent_visualizations: 2), {}, @headers
          end

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 1
          collection[0]['dependent_visualizations_count'].should eql 3
          collection[0]['dependent_visualizations'].length.should eq 2
          collection[0]['dependent_visualizations'].first['id'].should eql @dependencies[1].id
          collection[0]['dependent_visualizations'].first['name'].should_not be_nil
          collection[0]['dependent_visualizations'].second['id'].should eql @dependencies[0].id
          collection[0]['dependent_visualizations'].second['name'].should_not be_nil
        end
      end
    end

    context 'ordering' do

      it 'returns the expected status' do
        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: ''), {}, @headers
        last_response.status.should == 200

        get api_v1_visualizations_index_url(
          api_key: @user.api_key,
          types: 'derived',
          order: '',
          page: '',
          per_page: ''
        ), {}, @headers
        last_response.status.should == 200

        ['derived', 'slide'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :mapviews), {}, @headers
          last_response.status.should == 200
        end

        ['remote', 'table'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :size), {}, @headers
          last_response.status.should == 200
        end

        ['derived', 'remote', 'slide', 'table'].each do |type|
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: type, order: :whatever), {}, @headers
          last_response.status.should == 400
          JSON.parse(last_response.body).fetch('error').should_not be_nil
        end
      end

      it 'orders descending by default' do
        visualization_a = create(:carto_visualization, name: 'Visualization A', user_id: @user.id).store
        visualization_b = create(:carto_visualization, name: 'Visualization B', user_id: @user.id).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'name'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by name' do
        visualization_a = create(:carto_visualization, name: 'Visualization A', user_id: @user.id).store
        visualization_b = create(:carto_visualization, name: 'Visualization B', user_id: @user.id).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'name',
                                            order_direction: 'asc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      it 'orders by favorited' do
        visualization_a = create(:carto_visualization, user_id: @user.id).store
        visualization_b = create(:carto_visualization, user_id: @user.id).store
        visualization_a.add_like_from(@user)

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', with_dependent_visualizations: 10,
                                            order: 'favorited', order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      it 'orders by size' do
        vis1 = factory(@user, locked: true, type: 'remote', display_name: 'visu1')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis1.to_json, @headers
        vis1_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis1_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1,
          size: 100
        ).save

        vis2 = factory(@user, locked: true, type: 'remote', display_name: 'visu2')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis2.to_json, @headers
        vis2_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis2_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1,
          size: 200
        ).save

        vis3 = factory(@user, locked: true, type: 'remote', display_name: 'visu3')
        post api_v1_visualizations_create_url(api_key: @user.api_key), vis3.to_json, @headers
        vis3_id = JSON.parse(last_response.body).fetch('id')
        Carto::ExternalSource.new(
          visualization_id: vis3_id,
          import_url: 'http://www.fake.com',
          rows_counted: 1, size: 10
        ).save

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'remote', order: 'size'), {}, @headers
        last_response.status.should == 200
        response    = JSON.parse(last_response.body)
        collection  = response.fetch('visualizations')
        collection.length.should eq 3
        collection[0]['id'].should == vis2_id
        collection[1]['id'].should == vis1_id
        collection[2]['id'].should == vis3_id
      end

      xit 'orders by estimated row count' do
        visualization_a = create(:carto_visualization, user_id: @user.id)
        table = create(:table, user_id: @user.id)
        table.insert_row!(name: 'name1')
        table.update_table_pg_stats
        visualization_b = create(:carto_visualization, user_id: @user.id, map_id: table.map_id)

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'estimated_row_count',
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by privacy' do
        link_privacy = Carto::Visualization::PRIVACY_LINK
        public_privacy = Carto::Visualization::PRIVACY_PUBLIC
        visualization_a = create(:carto_visualization, user_id: @user.id, privacy: link_privacy).store
        visualization_b = create(:carto_visualization, user_id: @user.id, privacy: public_privacy).store

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', order: 'privacy',
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_b.id
        collection[1]['id'].should eq visualization_a.id
      end

      it 'orders by dependent visualizations' do
        table_a = create_random_table(@user)
        visualization_a = table_a.table_visualization
        dependent_visualization = create(:carto_visualization, user_id: @user.id)
        dependent_visualization.map = create(:carto_map, user_id: @user.id)
        dependent_visualization.save!
        layer = build(:carto_layer)
        layer.options[:table_name] = table_a.name
        layer.save!
        dependent_visualization.layers << layer
        table_b = create_random_table(@user)
        visualization_b = table_b.table_visualization

        get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'table', order: 'dependent_visualizations',
                                            with_dependent_visualizations: 10,
                                            order_direction: 'desc'), {}, @headers

        last_response.status.should == 200
        response = JSON.parse(last_response.body)
        collection = response.fetch('visualizations')
        collection.length.should eq 2
        collection[0]['id'].should eq visualization_a.id
        collection[1]['id'].should eq visualization_b.id
      end

      context 'by search rank' do
        before(:each) do
          @visualization_a = create(:carto_visualization, name: 'Best rank', user_id: @user.id).store
          @visualization_b = create(:carto_visualization, name: 'Another rank, but not the best',
                                                                      user_id: @user.id).store
        end

        it 'orders results by search rank when searching' do
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived',
                                              q: 'Best rank'), {}, @headers

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 2
          collection[0]['id'].should eq @visualization_a.id
          collection[1]['id'].should eq @visualization_b.id
        end

        it 'ignores other ordering parameters' do
          get api_v1_visualizations_index_url(api_key: @user.api_key, types: 'derived', q: 'Best rank',
                                              order: 'name', order_direction: 'asc'), {}, @headers

          last_response.status.should == 200
          response = JSON.parse(last_response.body)
          collection = response.fetch('visualizations')
          collection.length.should eq 2
          collection[0]['id'].should eq @visualization_a.id
          collection[1]['id'].should eq @visualization_b.id
        end
      end

      context 'error handling' do
        before(:each) do
          @valid_order = 'updated_at'
          @invalid_order = 'invalid_order'
          @valid_order_direction = 'asc'
          @invalid_order_direction = 'invalid_order_direction'
          @valid_order_combination = 'name,updated_at'
          @invalid_order_combination = 'size,updated_at'
          @valid_direction_combination = 'asc,desc'
          @invalid_direction_combination = 'asc,invalid'
        end

        it 'returns an error if an invalid :order is given' do
          get api_v1_visualizations_index_url(order: @valid_order, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @invalid_order, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order' parameter value"
        end

        it 'returns an error if an invalid :order_direction is given' do
          get api_v1_visualizations_index_url(order_direction: @valid_order_direction, order: @valid_order,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order_direction: @invalid_order_direction, order: @valid_order,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order_direction' parameter value"
        end

        it 'returns an error if an invalid :order combination is given' do
          get api_v1_visualizations_index_url(order: @valid_order_combination, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @invalid_order_combination, api_key: @user.api_key,
                                              types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order' parameter combination"
        end

        it 'returns an error if an invalid :order_direction combination is given' do
          get api_v1_visualizations_index_url(order: @valid_order_combination,
                                              order_direction: @valid_direction_combination,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 200

          get api_v1_visualizations_index_url(order: @valid_order_combination,
                                              order_direction: @invalid_direction_combination,
                                              api_key: @user.api_key, types: 'derived'), {}, @headers
          last_response.status.should == 400
          last_response.body.should include "Wrong 'order_direction' parameter combination"
        end
      end
    end
  end

  describe 'index' do
    include_context 'organization with users helper'
    include_context 'visualization creation helpers'

    describe 'shared_only' do
      it 'should not display nor count the shared visualizations you own' do
        table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_1.id)
        u1_t_1_id = table.table_visualization.id
        u1_t_1_perm_id = table.table_visualization.permission.id

        share_table_with_organization(table, @org_user_1, @organization)

        get api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                            type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
                                            shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
        body = JSON.parse(last_response.body)
        body['total_entries'].should eq 0
        body['visualizations'].count.should eq 0
      end
    end

    it 'returns auth tokens for password protected viz for the owner but not for users that have them shared' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_org_user_1)
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.password = 'wontbeused'
      @visualization.save!

      share_visualization(@visualization, @org_user_2)

      get_json api_v1_visualizations_index_url(user_domain: @org_user_1.username, api_key: @org_user_1.api_key,
                                               type: Carto::Visualization::TYPE_DERIVED,
                                               shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers do |response|
        response.status.should eq 200
        response.body[:visualizations][0][:id].should_not be_empty
        response.body[:visualizations][0][:auth_tokens].should_not be_empty
      end

      get_json api_v1_visualizations_index_url(user_domain: @org_user_2.username, api_key: @org_user_2.api_key,
                                               type: Carto::Visualization::TYPE_DERIVED,
                                               shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers do |response|
        response.status.should eq 200
        response.body[:visualizations][0][:id].should_not be_empty
        response.body[:visualizations][0][:auth_tokens].should be_empty
      end

      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end
  end

  describe 'visualization url generation' do
    include_context 'visualization creation helpers'
    include_context 'organization with users helper'

    before(:all) do
      @user = create(:valid_user)
    end

    after(:all) do
      @user.destroy
    end

    it 'generates a user table visualization url' do
      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @user.id)
      vis_id = table.table_visualization.id

      get_json api_v1_visualizations_show_url(user_domain: @user.username, id: vis_id, api_key: @user.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@user.username}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/tables/#{table.name}"
      end
    end

    it 'generates a user map url' do
      visualization = api_visualization_creation(@user, http_json_headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
      get_json api_v1_visualizations_show_url(user_domain: @user.username, id: visualization.id, api_key: @user.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@user.username}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/viz/#{visualization.id}/map"
      end
    end

    it 'generates a org user table visualization url' do
      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @org_user_1.id)
      vis_id = table.table_visualization.id

      get_json api_v1_visualizations_show_url(user_domain: @org_user_1.username, id: vis_id, api_key: @org_user_1.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@org_user_1.organization.name}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/u/#{@org_user_1.username}/tables/#{table.name}"
      end
    end

    it 'generates a organization user map url' do
      visualization = api_visualization_creation(@org_user_1, http_json_headers, { privacy: Visualization::Member::PRIVACY_PUBLIC, type: Visualization::Member::TYPE_DERIVED })
      get_json api_v1_visualizations_show_url(user_domain: @org_user_1.username, id: visualization.id, api_key: @org_user_1.api_key), {}, http_json_headers do |response|
        response.status.should == 200

        response.body[:url].should == "http://#{@org_user_1.organization.name}#{Cartodb.config[:session_domain]}:#{Cartodb.config[:http_port]}/u/#{@org_user_1.username}/viz/#{visualization.id}/map"
      end
    end

    it 'generates the URL for tables shared by another user with hyphens in their username' do
      user_with_hyphen = create(:user, username: 'fulano-de-tal', organization: @organization)
      table = create_random_table(user_with_hyphen, 'tabluca', UserTable::PRIVACY_PRIVATE)
      shared_table = table.table_visualization
      share_visualization(shared_table, @org_user_1)

      request_url = api_v1_visualizations_show_url(user_domain: @org_user_1.username,
                                                   id: shared_table.id, api_key: @org_user_1.api_key)
      get_json request_url, {}, http_json_headers do |response|
        response.status.should == 200
        response.body[:url].should include("/tables/fulano-de-tal.tabluca")
      end
    end
  end
end
