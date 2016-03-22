# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/layers_controller'
require_relative '../../../../spec/requests/api/json/layers_controller_shared_examples'
require 'helpers/unique_names_helper'

describe Carto::Api::LayersController do
  include UniqueNamesHelper
  it_behaves_like 'layers controllers' do
  end

  describe 'attribution changes' do
    include Rack::Test::Methods
    include Warden::Test::Helpers

    before(:all) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true, delete: true)
      CartoDB::Visualization::Member.any_instance.stubs(:invalidate_cache).returns(nil)

      @headers = { 'CONTENT_TYPE' => 'application/json' }

      @user = FactoryGirl.create(:valid_user)
    end

    after(:each) do
      @user.destroy
    end

    it 'attribution changes in a visualization propagate to associated layers' do
      table_1_attribution = 'attribution 1'
      table_2_attribution = 'attribution 2'
      modified_table_2_attribution = 'modified attribution 2'

      table1 = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @user.id)
      table2 = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: unique_name('table'), user_id: @user.id)

      payload = {
        name: 'new visualization',
        tables: [
          table1.name,
          table2.name
        ],
        privacy: 'public'
      }

      login_as(@user, scope: @user.username)
      host! "#{@user.username}.localhost.lan"
      post api_v1_visualizations_create_url(api_key: @api_key), payload.to_json, @headers do |response|
        response.status.should eq 200
        @visualization_data = JSON.parse(response.body)
      end

      visualization = Carto::Visualization.find(@visualization_data.fetch('id'))
      table1_visualization = CartoDB::Visualization::Member.new(id: table1.table_visualization.id).fetch
      table1_visualization.attributions = table_1_attribution
      table1_visualization.store
      table2_visualization = CartoDB::Visualization::Member.new(id: table2.table_visualization.id).fetch
      table2_visualization.attributions = table_2_attribution
      table2_visualization.store

      get api_v1_maps_layers_index_url(map_id: visualization.map.id, api_key: @api_key) do |response|
        response.status.should be_success
        @layers_data = JSON.parse(response.body)
      end
      # Done this way to preserve the order
      data_layers = @layers_data['layers']
      data_layers.delete_if { |layer| layer['kind'] != 'carto' }
      data_layers.count.should eq 2

      # Rembember, layers by default added at top
      data_layers[0]['options']['attribution'].should eq table_2_attribution
      data_layers[1]['options']['attribution'].should eq table_1_attribution

      table2_visualization.attributions = modified_table_2_attribution
      table2_visualization.store

      get api_v1_maps_layers_index_url(map_id: visualization.map.id, api_key: @api_key) do |response|
        response.status.should be_success
        @layers_data = JSON.parse(response.body)
      end
      data_layers = @layers_data['layers'].select { |layer| layer['kind'] == 'carto' }
      data_layers.count.should eq 2

      # Rembember, layers by default added at top
      data_layers[0]['options']['attribution'].should eq modified_table_2_attribution
      data_layers[1]['options']['attribution'].should eq table_1_attribution
    end
  end

  describe 'index' do
    include Rack::Test::Methods
    include Warden::Test::Helpers
    include CacheHelper
    include_context 'visualization creation helpers'
    include_context 'users helper'

    it 'fetches layers from shared visualizations' do
      # TODO: refactor this with helpers (pending to merge)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true, delete: true)
      CartoDB::Visualization::Member.any_instance.stubs(:invalidate_cache).returns(nil)
      @headers = { 'CONTENT_TYPE' => 'application/json' }

      def factory(user, attributes = {})
        {
          name:                     attributes.fetch(:name, unique_name('viz')),
          tags:                     attributes.fetch(:tags, ['foo', 'bar']),
          map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: user.id).id),
          description:              attributes.fetch(:description, 'bogus'),
          type:                     attributes.fetch(:type, 'derived'),
          privacy:                  attributes.fetch(:privacy, 'public'),
          source_visualization_id:  attributes.fetch(:source_visualization_id, nil),
          parent_id:                attributes.fetch(:parent_id, nil),
          locked:                   attributes.fetch(:locked, false),
          prev_id:                  attributes.fetch(:prev_id, nil),
          next_id:                  attributes.fetch(:next_id, nil)
        }
      end

      user_1 = create_user(
        username: unique_name('user'),
        email: unique_email,
        password: 'clientex',
        private_tables_enabled: false
      )

      user_2 = create_user(
        username: unique_name('user'),
        email: unique_email,
        password: 'clientex',
        private_tables_enabled: false
      )

      user_3 = create_user(
        username: unique_name('user'),
        email: unique_email,
        password: 'clientex',
        private_tables_enabled: false
      )

      organization = Organization.new
      organization.name = unique_name('org')
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      user_3.organization_id = organization.id
      user_3.save.reload
      organization.reload

      default_url_options[:host] = "#{user_2.subdomain}.localhost.lan"

      table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: unique_name('table'), user_id: user_1.id)
      u1_t_1_perm_id = table.table_visualization.permission.id

      put api_v1_permissions_update_url(user_domain: user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
          { acl: [{
            type: CartoDB::Permission::TYPE_USER,
            entity: {
              id:   user_2.id
            },
            access: CartoDB::Permission::ACCESS_READONLY
          }] }.to_json, @headers

      layer = Layer.create(
        kind: 'carto',
        tooltip: {},
        options: {},
        infowindow: {}
      )

      table.map.add_layer layer

      login_as(user_2, scope: user_2.username)
      get api_v1_maps_layers_index_url(user_domain: user_2.username, map_id: table.map.id) do |response|
        response.status.should be_success
        body = JSON.parse(last_response.body)

        body['layers'].count { |l| l['kind'] != 'tiled' }.should == 2
      end

      login_as(user_3, scope: user_3.username)
      host! "#{user_3.username}.localhost.lan"
      get api_v1_maps_layers_index_url(user_domain: user_3.username, map_id: table.map.id) do |response|
        response.status.should == 404
      end
    end
  end

  describe '#show legacy tests' do
    before(:all) do
      @user = create_user(
        username: 'test',
        email:    'client@example.com',
        password: 'clientex'
      )

      host! "#{@user.username}.localhost.lan"
    end

    before(:each) do
      stub_named_maps_calls
      delete_user_data @user
      @table = create_table user_id: @user.id
    end

    after(:all) do
      stub_named_maps_calls
      @user.destroy
    end

    let(:params) { { api_key: @user.api_key } }

    it "Get all user layers" do
      layer = Layer.create kind: 'carto'
      layer2 = Layer.create kind: 'tiled'
      @user.add_layer layer
      @user.add_layer layer2

      default_url_options[:host] = "#{@user.subdomain}.localhost.lan"
      get api_v1_users_layers_index_url(params.merge(user_id: @user.id)) do |_|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['total_entries'].should   eq 2
        body['layers'].count { |l| l['kind'] != 'tiled' }.should eq 2
        response_body['layers'][0]['id'].should eq layer.id
        response_body['layers'][1]['id'].should eq layer2.id
      end
    end

    it "Gets layers by map id" do
      layer = Layer.create(
        kind: 'carto',
        tooltip: {},
        options: {},
        infowindow: {}
      )
      layer2 = Layer.create(
        kind: 'tiled',
        tooltip: {},
        options: {},
        infowindow: {}
      )

      expected_layers_ids = [layer.id, layer2.id]

      existing_layers_ids = @table.map.layers.map(&:id)
      existing_layers_count = @table.map.layers.count

      @table.map.add_layer layer
      @table.map.add_layer layer2

      default_url_options[:host] = "#{@user.subdomain}.localhost.lan"
      get api_v1_maps_layers_index_url(params.merge(map_id: @table.map.id)) do |_|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['total_entries'].should eq 2 + existing_layers_count
        body['layers'].count { |l| l['kind'] != 'tiled' }.should eq 2 + existing_layers_count
        new_layers_ids = response_body['layers'].map { |l| l['id'] }
        (new_layers_ids - existing_layers_ids).should == expected_layers_ids
      end

      get api_v1_maps_layers_show_url(
        params.merge(
          map_id: @table.map.id,
          id: layer.id
        )) do |_|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['id'].should eq layer.id
        response_body['kind'].should eq layer.kind
      end
    end
  end
end
