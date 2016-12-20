# encoding: utf-8

shared_examples_for "layers controllers" do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
  include Carto::Factories::Visualizations

  include_context 'users helper'

  describe '#operations' do
    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      @layer.destroy if @layer
      @layer2.destroy if @layer2
    end

    let(:kind) { 'carto' }

    let(:create_layer_url) do
      api_v1_users_layers_create_url(user_domain: @user1.username, user_id: @user1.id, api_key: @user1.api_key)
    end

    def create_map_layer_url(map_id)
      api_v1_maps_layers_create_url(user_domain: @user1.username, map_id: map_id, api_key: @user1.api_key)
    end

    def update_map_layer_url(map_id, layer_id = nil)
      api_v1_maps_layers_update_url(
        user_domain: @user1.username,
        map_id: map_id,
        id: layer_id,
        api_key: @user1.api_key)
    end

    def delete_map_layer_url(map_id, layer_id)
      api_v1_maps_layers_destroy_url(
        user_domain: @user1.username,
        map_id: map_id,
        id: layer_id,
        api_key: @user1.api_key)
    end

    let(:layer_json) do
      { kind: kind, options: { table_name: nil, user_name: nil }, order: 1, infowindow: {}, tooltip: {} }
    end

    it 'creates layers' do
      post_json create_layer_url, layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response.delete(:id).should_not be_nil
        layer_response.should eq layer_json
      end
    end

    it 'creates layers on maps' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1)
      # Let's make room for another layer of the same kind
      destroyed_layer = @map.layers.where(kind: layer_json[:kind]).first
      destroyed_layer.destroy if destroyed_layer

      post_json create_map_layer_url(@map.id), layer_json.merge(options: { table_name: @table.name }) do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_id = layer_response.delete(:id)
        layer_id.should_not be_nil

        layer_response.delete(:options).should eq ({ table_name: @table.name })

        layer_response.should eq layer_json.except(:options)

        @layer = Carto::Layer.find(layer_id)
        @layer.maps.map(&:id).first.should eq @map.id
      end
    end

    it 'does not allow to exceed max_layers' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1)
      @carto_user1.max_layers = 1
      @carto_user1.save

      post_json create_map_layer_url(@map.id), layer_json.merge(kind: 'tiled', order: 10) do |response|
        response.status.to_s.should match /4../ # 422 in new, 403 in old
      end
    end

    it 'updates one layer' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      new_order = 2
      new_layer_json = layer_json.merge(
        options: { random: '1' },
        order: new_order
      )
      put_json update_map_layer_url(map.id, @layer.id), new_layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:id].should eq @layer.id
        layer_response[:options].should eq new_layer_json[:options]
        layer_response[:order].should eq new_order
      end
    end

    it 'updates several layers at once' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first
      @layer2 = FactoryGirl.create(:carto_layer, maps: [map])

      new_order = 2
      new_layer_json = layer_json.merge(
        options: { 'random' => '1' },
        order: new_order
      )
      new_layers_json = {
        layers: [
          new_layer_json.merge(id: @layer.id),
          new_layer_json.merge(id: @layer2.id)
        ]
      }
      put_json update_map_layer_url(map.id), new_layers_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:layers].map { |l| l['id'] }.should eq [@layer.id, @layer2.id]
        layer_response[:layers].each do |layer|
          layer['options'].should eq new_layer_json[:options]
          layer['order'].should eq new_order
        end
      end
    end

    it 'does not update table_name or users_name options' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      new_layer_json = layer_json.merge(
        options: { table_name: 'other_table_name', user_name: 'other_username' }
      )
      put_json update_map_layer_url(map.id, @layer.id), new_layer_json do |response|
        response.status.should eq 200
        layer_response = response.body

        layer_response[:options].should eq layer_json[:options]
      end
    end

    it 'destroys layers' do
      map = FactoryGirl.create(:carto_map_with_layers, user_id: @user1.id)
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1, map: map)
      @layer = map.layers.first

      delete_json delete_map_layer_url(map.id, @layer.id), {} do |response|
        response.status.should eq 204
        Carto::Layer.exists?(@layer.id).should be_false
      end
    end
  end

  describe 'creating a layer from an analysis node moves the style history' do
    def create_layer(new_source, new_letter, from_letter)
      url = api_v1_maps_layers_create_url(user_domain: @user2.username, map_id: @map.id, api_key: @user2.api_key)
      payload = {
        kind: 'carto',
        options: {
          source: new_source,
          letter: new_letter,
          table_name: @table.name,
          user_name: @user2.username
        },
        infowindow: {},
        tooltip: {},
        from_layer_id: @original_layer.id,
        from_letter: from_letter
      }
      post_json url, payload do |response|
        response.status.should eq 200
        layer_response = response.body

        Carto::Layer.find(layer_response[:id])
      end
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user2)
      @original_layer = @map.data_layers.first
      @original_layer.options[:source] = 'a2'
      @original_layer.save
      @original_layer.layer_node_styles.each(&:destroy)

      ['a2', 'a1', 'a0'].each do |node_id|
        LayerNodeStyle.create(
          layer_id: @original_layer.id,
          source_id: node_id,
          options: { original_id: node_id },
          infowindow: {},
          tooltip: {}
        )
      end
    end

    after(:each) do
      @layer.destroy if @layer
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    def verify_layer_node_styles(layer, styles_map)
      # Map original_source_id -> new_source_id
      layer.layer_node_styles.reload
      actual_styles_map = layer.layer_node_styles.map { |lns| [lns.options[:original_id], lns.source_id] }.to_h
      actual_styles_map.should eq styles_map
    end

    it 'when dragging an intermediate node' do
      # A new layer B is created (copy A1 -> B1, A0 -> B0) and the old one starts using it as a source (rename A1 -> B1)
      #
      #   _______       _______   ______
      #  | A    |      | A    |  | B    |
      #  |      |      |      |  |      |
      #  | [A2] |      | [A2] |  |      |
      #  | {A1} |  =>  | {B1} |  | {B1} |
      #  | [A0] |      |      |  | [B0] |
      #  |______|      |______|  |______|

      @new_layer = create_layer('b1', 'b', 'a')

      verify_layer_node_styles(@new_layer, nil => 'b1', 'a0' => 'b0')
      verify_layer_node_styles(@original_layer, 'a2' => 'a2', 'a1' => 'b1')
    end

    describe 'when dragging a header node' do
      # The original layer is renamed to B (rename A2 -> B1, A1 -> B1) and the new layer is named A (copy A1 and A0)
      # The rename and the layer creation are independent requests, so we have to handle
      # both possible orders of requests gracefully.
      #   _______       _______   ______
      #  | A    |      | A    |  | B    |
      #  |      |      |      |  |      |
      #  | {A2} |  =>  |      |  | {B1} |
      #  | [A1] |      | [A1] |  | [A1] |
      #  | [A0] |      | [A0] |  |      |
      #  |______|      |______|  |______|
      it 'and the original layer has been previously renamed' do
        old_model_layer = ::Layer[@original_layer.id]
        old_model_layer.options['letter'] = 'b'
        old_model_layer.options['source'] = 'b1'
        old_model_layer.save
        @new_layer = create_layer('a1', 'a', 'a')

        verify_layer_node_styles(@new_layer, nil => 'a1', 'a0' => 'a0')
        verify_layer_node_styles(@original_layer, nil => 'b1', 'a1' => 'a1')
      end

      it 'and the original layer has not yet been renamed' do
        @new_layer = create_layer('a1', 'a', 'a')

        verify_layer_node_styles(@new_layer, nil => 'a1', 'a0' => 'a0')
        verify_layer_node_styles(@original_layer, 'a1' => 'a1')
      end
    end
  end

  describe "API 1.0 map layers management" do
    before(:all) do
      Capybara.current_driver = :rack_test
      @user = create_user
    end

    before(:each) do
      bypass_named_maps
      delete_user_data @user
      host! "#{@user.username}.localhost.lan"
      @table = create_table(user_id: @user.id)
      @map = create_map(user_id: @user.id, table_id: @table.id)
      @table.reload
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    let(:params) { { api_key: @user.api_key } }

    it "Create a new layer associated to a map" do
      opts = { type: "GMapsBase", base_type: "roadmap", style: "null", order: "0", query_history: [] }
      infowindow = { fields: ['column1', 'column2', 'column3'] }

      data = { kind: 'gmapsbase', infowindow: infowindow, options: opts }

      post_json api_v1_maps_layers_create_url(params.merge(map_id: @map.id)), data do |response|
        response.status.should be_success
        @map.layers.size.should == 1
        response.body[:id].should == @map.layers.first.id
        response.body[:options].should == opts
        response.body[:infowindow].should == infowindow
        response.body[:order].should == 0
        response.body[:kind].should == 'gmapsbase'
      end
    end

    it "Get layer information" do
      layer = Layer.create(
        kind: 'carto',
        order: 1,
        options: { opt1: 'value' },
        infowindow: { fields: ['column1', 'column2'] },
        tooltip: { fields: ['column1', 'column3'] }
      )
      @map.add_layer layer

      get_json api_v1_maps_layers_show_url(params.merge(id: layer.id, map_id: @map.id)) do |response|
        response.status.should be_success
        response.body[:id].should    eq layer.id
        response.body[:kind].should  eq 'carto'
        response.body[:order].should eq 1
        response.body[:infowindow].should eq fields: ["column1", "column2"]
        response.body[:tooltip].should eq fields: ["column1", "column3"]
      end
    end

    it "Get all map layers" do
      layer  = Layer.create kind: 'carto', order: 3
      layer2 = Layer.create kind: 'tiled', order: 2
      layer3 = Layer.create kind: 'tiled', order: 1
      @map.add_layer layer
      @map.add_layer layer2
      @map.add_layer layer3

      get_json api_v1_maps_layers_index_url(params.merge(map_id: @map.id)) do |response|
        response.status.should be_success
        response.body[:total_entries].should == 3
        response.body[:layers].size.should == 3
        response.body[:layers][0]['id'].should == layer3.id
        response.body[:layers][1]['id'].should == layer2.id
        response.body[:layers][2]['id'].should == layer.id
      end
    end

    # see https://cartodb.atlassian.net/browse/CDB-3350
    it "Update a layer" do
      layer = Layer.create kind: 'carto', order: 0
      @map.add_layer layer

      data = { options: { opt1: 'value' }, infowindow: { fields: ['column1', 'column2'] }, order: 3, kind: 'carto' }

      put_json api_v1_maps_layers_update_url(params.merge(id: layer.id, map_id: @map.id)), data do |response|
        response.status.should be_success
        response.body[:id].should == layer.id
        response.body[:options].should == { opt1: 'value' }
        response.body[:infowindow].should == { fields: ['column1', 'column2'] }
        response.body[:kind].should == 'carto'
        response.body[:order].should == 3
      end
    end

    it "Update several layers at once" do
      layer_1 = Layer.create kind: 'carto', order: 0
      layer_2 = Layer.create kind: 'carto', order: 1
      @map.add_layer layer_1
      @map.add_layer layer_2

      data = { layers: [
        { id: layer_1.id, options: { opt1: 'value' }, infowindow: { fields: ['column1'] }, order: 2, kind: 'carto' },
        { id: layer_2.id, options: { opt1: 'value' }, infowindow: { fields: ['column1'] }, order: 3, kind: 'carto' }
      ] }

      put_json api_v1_maps_layers_update_url(params.merge(map_id: @map.id)), data do |response|
        response.status.should be_success
        response_layers = response.body[:layers]
        response_layers.count.should == 2
        response_layers.find { |l| l['id'] == layer_1.id }['order'].should == 2
        response_layers.find { |l| l['id'] == layer_2.id }['order'].should == 3
        layer_1.reload.order.should == 2
        layer_2.reload.order.should == 3
      end
    end

    it "Update a layer does not change table_name neither user_name" do
      layer = Layer.create kind: 'carto', order: 0, options: { table_name: 'table1', user_name: @user.username }
      @map.add_layer layer

      data = { options: { table_name: 't1', user_name: 'u1' }, order: 3, kind: 'carto' }

      put_json api_v1_maps_layers_update_url(params.merge(id: layer.id, map_id: @map.id)), data do |response|
        response.status.should be_success
        layer.options[:table_name].should == 'table1'
        layer.options[:user_name].should == @user.username
        response.body[:options].should == { table_name: 'table1', user_name: @user.username }
      end
    end

    # see https://cartodb.atlassian.net/browse/CDB-3350
    it "Update a layer > tiler error" do
      layer = Layer.create kind: 'carto', order: 0
      @map.add_layer layer
      Layer.any_instance.stubs(:after_save).raises(RuntimeError)
      Carto::Layer.any_instance.stubs(:invalidate_maps).raises(RuntimeError)

      data = { options: { opt1: 'value' }, infowindow: { fields: ['column1', 'column2'] }, order: 999, kind: 'carto' }

      put_json api_v1_maps_layers_update_url(params.merge(id: layer.id, map_id: @map.id)), data do |response|
        response.status.should eq 400
        layer.reload.order.should_not eq 999
      end
    end

    it "Drop a layer" do
      layer = Layer.create kind: 'carto'
      @map.add_layer layer

      delete_json api_v1_maps_layers_destroy_url(params.merge(id: layer.id, map_id: @map.id)) do |response|
        response.status.should eq 204
        expect { layer.refresh }.to raise_error
      end
    end
  end

  describe "API 1.0 user layers management" do
    before(:all) do
      Capybara.current_driver = :rack_test
      @user = create_user
    end

    before(:each) do
      bypass_named_maps
      delete_user_data @user
      host! "#{@user.username}.localhost.lan"
      @table = create_table(user_id: @user.id)
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    let(:params) { { api_key: @user.api_key } }

    it "Create a new layer associated to the current user" do
      opts = { kind: 'carto' }

      post_json api_v1_users_layers_create_url(params.merge(user_id: @user.id)), opts do |response|
        response.status.should    be_success
        @user.layers.size.should  eq 1
        response.body[:id].should eq @user.layers.first.id
      end
    end

    # see https://cartodb.atlassian.net/browse/CDB-3350
    it "Update a layer" do
      layer = Layer.create kind: 'carto'
      @user.add_layer layer
      opts = { options: { opt1: 'value' }, infowindow: { fields: ['column1', 'column2'] }, kind: 'carto' }

      put_json api_v1_users_layers_update_url(params.merge(id: layer.id, user_id: @user.id)), opts do |response|
        response.status.should be_success
        response.body[:id].should eq layer.id
        response.body[:options].should eq opt1: 'value'
        response.body[:infowindow].should == { fields: ['column1', 'column2'] }
        response.body[:kind].should eq 'carto'
      end
    end

    it "Drop a layer" do
      layer = Layer.create kind: 'carto'
      @user.add_layer layer

      delete_json api_v1_users_layers_destroy_url(params.merge(id: layer.id, user_id: @user.id)) do |response|
        response.status.should eq 204
        expect { layer.refresh }.to raise_error
      end
    end
  end
end
