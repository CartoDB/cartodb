shared_examples_for 'Layer model' do
  context "setups" do
    it "should be preloaded with the correct default values" do
      l = layer_class.create(Cartodb.config[:layer_opts]["data"]).reload
      l.kind.should == 'carto'
      l.options.should == Cartodb.config[:layer_opts]["data"]["options"]
      l = layer_class.create(Cartodb.config[:layer_opts]["background"]).reload
      l.kind.should == 'background'
      l.options.should == Cartodb.config[:layer_opts]["background"]["options"]
    end

    it "should not allow to create layers of unkown types" do
      expect { layer_class.create(kind: "wadus").save! }.to raise_error
    end

    it "should allow to be linked to many maps" do
      table2 = Table.new
      table2.user_id = user.id
      table2.save
      layer = layer_class.create(kind: 'carto')
      map   = create_map(user_id: user.id, table_id: @table.id)
      map2  = create_map(user_id: user.id, table_id: table2.id)

      add_layer_to_entity(map, layer)
      add_layer_to_entity(map2, layer)
      layer.reload

      map.layers.first.id.should  == layer.id
      map2.layers.first.id.should == layer.id
      layer.maps.should include(map, map2)
    end

    it "should allow to be linked to many users" do
      layer = layer_class.create(kind: 'carto')
      add_layer_to_entity(user, layer)

      user.reload.layers.map(&:id).should include(layer.id)
      layer.users.map(&:id).should include(user.id)
    end

    it "should set default order when adding layers to a map" do
      map = create_map(user_id: user.id, table_id: @table.id)
      5.times do |i|
        layer = layer_class.create(kind: 'carto')
        add_layer_to_entity(map, layer)
        layer.reload.order.should == i
      end
    end

    it "should set default order when adding layers to a user" do
      user.layers.each(&:destroy)
      user.reload
      5.times do |i|
        layer = layer_class.create(kind: 'carto')
        add_layer_to_entity(user, layer)
        layer.reload.order.should == i
      end
    end

    context "when the type is cartodb and the layer is updated" do
      before do
        @map = create_map(user_id: user.id, table_id: @table.id)
        @layer = layer_class.create(kind: 'carto', options: { query: "select * from #{@table.name}" })
        add_layer_to_entity(@map, @layer)
      end

      it "should invalidate its maps" do
        CartoDB::Varnish.any_instance.stubs(:purge).returns(true)

        @layer.maps.count.should eq 1
        @layer.maps.each do |map|
          map.expects(:notify_map_change).times(1)
        end

        @layer.save
      end
    end

    context "when the type is not cartodb" do
      before do
        @map = create_map(user_id: user.id, table_id: @table.id)
        @layer = layer_class.create(kind: 'tiled')
        add_layer_to_entity(@map, @layer)
      end

      it "should not invalidate its related tables varnish cache" do
        @layer.maps.each do |map|
          map.expects(:notify_map_change).times(1)
        end

        @layer.send(:affected_tables).each do |table|
          table.expects(:update_cdb_tablemetadata).times(0)
        end

        @layer.save
      end
    end

    it "should update updated_at after saving" do
      layer = layer_class.create(kind: 'carto')
      after = layer.updated_at
      Delorean.jump(1.minute)
      layer.options[:query] = 'SELECT * FROM arbitrary_change'
      layer.save
      after.should < layer.updated_at
      Delorean.back_to_the_present
    end

    it "should correctly identify affected tables" do
      table2 = Table.new
      table2.user_id = user.id
      table2.save
      map = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(
        kind: 'carto',
        options: { query: "select * from #{@table.name}, #{table2.name};select 1;select * from #{table2.name}" }
      )
      add_layer_to_entity(map, layer)
      layer.reload

      layer.send(:affected_tables).map(&:name).should =~ [table2.name, @table.name]
    end

    it "should return empty affected tables when no tables are involved" do
      map = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(
        kind: 'carto',
        options: { query: "select 1" }
      )
      add_layer_to_entity(map, layer)

      layer.send(:affected_tables).map(&:name).should =~ []
    end

    it 'includes table_name option in the results' do
      map = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(
        kind: 'carto',
        options: { query: "select 1", table_name: @table.name }
      )
      add_layer_to_entity(map, layer)
      layer.reload

      layer.send(:affected_tables).map(&:name).should =~ [@table.name]
    end
  end

  describe '#base_layer?' do
    it 'returns true if its kind is a base layer' do
      layer = layer_class.new(kind: 'tiled')
      layer.base_layer?.should == true
    end
  end

  describe '#data_layer?' do
    it 'returns true if its of a carto kind' do
      layer = layer_class.new(kind: 'carto')
      layer.data_layer?.should == true
    end
  end

  describe '#rename_table' do
    it 'renames table in layer options' do
      table_name      = 'table_name'
      new_table_name  = 'changed_name'

      tile_style      = "##{table_name} { color:red; }"
      query           = "SELECT * FROM table_name, other_table"
      options = {
        table_name: table_name,
        tile_style: tile_style,
        query:      query
      }

      layer = layer_class.create(kind: 'carto', options: options)
      layer.rename_table(table_name, new_table_name)
      layer.save
      layer.reload

      options = layer.options
      options.fetch('tile_style') .should      =~ /#{new_table_name}/
      options.fetch('tile_style') .should_not  =~ /#{table_name}/
      options.fetch('query')      .should      =~ /#{new_table_name}/
      options.fetch('query')      .should_not  =~ /#{table_name}/
      options.fetch('table_name') .should      =~ /#{new_table_name}/
      options.fetch('table_name') .should_not  =~ /#{table_name}/
    end

    it "won't touch the query if it doesn't match" do
      table_name      = 'table_name'
      new_table_name  = 'changed_name'

      tile_style      = "##{table_name} { color:red; }"
      query           = "SELECT * FROM foo"
      options = {
        table_name: table_name,
        tile_style: tile_style,
        query:      query
      }
      layer = layer_class.create(kind: 'carto', options: options)
      layer.rename_table(table_name, new_table_name)
      layer.save
      layer.reload

      layer.options.fetch('query').should == options.fetch(:query)
    end
  end

  describe '#destroy' do
    it 'invalidates the vizjson cache of all related maps' do
      map   = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(kind: 'carto')
      add_layer_to_entity(map, layer)

      # TODO: should be once
      map.class.any_instance.expects(:notify_map_change).at_least_once
      layer.destroy
    end

    it 'deletes ternary relations' do
      map   = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(kind: 'carto')
      layer.options[:query] = "SELECT * FROM #{@table.name}"
      layer.register_table_dependencies
      add_layer_to_entity(map, layer)
      add_layer_to_entity(user, layer)

      layer.destroy

      Carto::LayersMap.where(layer_id: layer.id).exists?.should be_false
      Carto::LayersUser.where(layer_id: layer.id).exists?.should be_false
      Carto::LayersUserTable.where(layer_id: layer.id).exists?.should be_false
    end
  end

  describe '#uses_private_tables?' do
    it 'returns true if any of the affected tables is private' do
      layers = @table.table_visualization.data_layers
      layers.length.should == 1
      layers.first.uses_private_tables?.should be_true
      @table.privacy = UserTable::PRIVACY_PUBLIC
      @table.save
      user.reload

      layers.first.reload
      layers.first.uses_private_tables?.should be_false
    end
  end

  context 'viewer role' do
    after(:each) do
      user.viewer = false
      user.save
    end

    it "can't update layers" do
      map   = create_map(user_id: user.id, table_id: @table.id)
      layer = layer_class.create(kind: 'carto')
      add_layer_to_entity(map, layer)

      user.viewer = true
      user.save

      layer.reload

      layer.kind = 'torque'
      saved = begin
                layer.save
              rescue StandardError
                false
              end
      saved.should be_false
    end
  end

  describe '#LayerNodeStyle cache' do
    let(:map) { create_map(user_id: user.id, table_id: @table.id) }
    let(:layer) { layer_class.create(kind: 'carto') }

    before { add_layer_to_entity(map, layer) }

    it 'saves styles for layers with source_id' do
      layer.options['source'] = 'a0'
      layer.save
      lns = Carto::LayerNodeStyle.find_by(layer_id: layer.id)
      lns.should be
      lns.tooltip.should eq layer.tooltip || {}
      lns.infowindow.should eq layer.infowindow || {}
      lns.options['tile_style'].should eq layer.options['tile_style']
      lns.options['sql_wrap'].should eq layer.options['sql_wrap']
      lns.options['style_properties'].should eq layer.options['style_properties']
    end

    it 'does not save styles for layers with source_id' do
      layer.options['source'] = nil
      layer.save
      Carto::LayerNodeStyle.where(layer_id: layer.id).count.should eq 0
    end

    it 'saves styles for torque layers' do
      layer.kind = 'torque'
      layer.options['source'] = 'a0'
      layer.save
      lns = Carto::LayerNodeStyle.find_by(layer_id: layer.id)
      lns.should be
      lns.tooltip.should eq layer.tooltip || {}
      lns.infowindow.should eq layer.infowindow || {}
      lns.options['tile_style'].should eq layer.options['tile_style']
      lns.options['sql_wrap'].should eq layer.options['sql_wrap']
      lns.options['style_properties'].should eq layer.options['style_properties']
    end
  end
end
