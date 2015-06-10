# encoding: utf-8

shared_examples_for "layers controllers" do

  describe 'index' do
    include_context 'visualization creation helpers'
    include_context 'users helper'

    it 'fetches layers from shared visualizations' do
      # TODO: refactor this with helpers (pending to merge)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
      CartoDB::Visualization::Member.any_instance.stubs(:invalidate_cache).returns(nil)
      @headers = {'CONTENT_TYPE'  => 'application/json'}

      def factory(user, attributes={})
        {
          name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
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
        username: "test#{rand(9999)}-1",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      user_2 = create_user(
        username: "test#{rand(9999)}-2",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      user_3 = create_user(
        username: "test#{rand(9999)}-3",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      organization = Organization.new
      organization.name = "org#{rand(9999)}"
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

      table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: "table#{rand(9999)}_1", user_id: user_1.id)
      u1_t_1_id = table.table_visualization.id
      u1_t_1_perm_id = table.table_visualization.permission.id

      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
          {acl: [{
            type: CartoDB::Permission::TYPE_USER,
            entity: {
              id:   user_2.id,
            },
            access: CartoDB::Permission::ACCESS_READONLY
          }]}.to_json, @headers

      layer = Layer.create({
          kind: 'carto',
          tooltip: {},
          options: {},
          infowindow: {}
        })

      table.map.add_layer layer

      login_as(user_2, scope: user_2.subdomain)
      host! "#{user_2.subdomain}.localhost.lan"
      get api_v1_maps_layers_index_url(map_id: table.map.id) do |response|
        response.status.should be_success
        body = JSON.parse(last_response.body)
        body['layers'].size.should == 3
      end

      login_as(user_3, scope: user_3.subdomain)
      host! "#{user_3.subdomain}.localhost.lan"
      get api_v1_maps_layers_index_url(map_id: table.map.id) do |response|
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

      host! 'test.localhost.lan'
    end

    before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
      delete_user_data @user
      @table = create_table :user_id => @user.id
    end

    after(:all) do
      @user.destroy
    end


    let(:params) { { :api_key => @user.api_key } }

    it "Get all user layers" do
      layer = Layer.create kind: 'carto'
      layer2 = Layer.create kind: 'tiled'
      @user.add_layer layer
      @user.add_layer layer2

      get api_v1_users_layers_index_url(params.merge(user_id: @user.id)) do |response|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['total_entries'].should   eq 2
        response_body['layers'].size.should     eq 2
        response_body['layers'][0]['id'].should eq layer.id
        response_body['layers'][1]['id'].should eq layer2.id
      end
    end

    it "Gets layers by map id" do
      layer = Layer.create({
          kind: 'carto',
          tooltip: {},
          options: {},
          infowindow: {}
        })
      layer2 = Layer.create({
          kind: 'tiled',
          tooltip: {},
          options: {},
          infowindow: {}
        })

      expected_layers_ids = [layer.id, layer2.id]

      existing_layers_ids = @table.map.layers.collect(&:id)
      existing_layers_count = @table.map.layers.count

      @table.map.add_layer layer
      @table.map.add_layer layer2

      get api_v1_maps_layers_index_url(params.merge(map_id: @table.map.id)) do |response|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['total_entries'].should == 2 + existing_layers_count
        response_body['layers'].size.should == 2 + existing_layers_count
        new_layers_ids = response_body['layers'].collect { |layer| layer['id'] }
        (new_layers_ids - existing_layers_ids - expected_layers_ids).should == []
      end

      get api_v1_maps_layers_show_url(params.merge({
            map_id: @table.map.id,
            id: layer.id
          })) do |response|
        last_response.status.should be_success
        response_body = JSON.parse(last_response.body)
        response_body['id'].should == layer.id
        response_body['kind'].should == layer.kind
      end


    end

  end

end
