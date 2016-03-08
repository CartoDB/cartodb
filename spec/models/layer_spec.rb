require 'spec_helper'

describe Layer do

  before(:all) do
    @quota_in_bytes = 500.megabytes
    @table_quota = 500
  end

  after(:all) do
    # Using Mocha stubs until we update RSpec (@see http://gofreerange.com/mocha/docs/Mocha/ClassMethods.html)
    stub_named_maps_calls
  end

  before(:each) do
    @user = FactoryGirl.create(:valid_user, private_tables_enabled: true)

    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    stub_named_maps_calls

    CartoDB::Overlay::Member.any_instance.stubs(:can_store).returns(true)

    @table = Table.new
    @table.user_id = @user.id
    @table.save
  end

  after(:each) do
    @user.destroy
  end

  context "setups" do

    it "should be preloaded with the correct default values" do
      l = Layer.create(Cartodb.config[:layer_opts]["data"]).reload
      l.kind.should == 'carto'
      l.options.should == Cartodb.config[:layer_opts]["data"]["options"]
      l = Layer.create(Cartodb.config[:layer_opts]["background"]).reload
      l.kind.should == 'background'
      l.options.should == Cartodb.config[:layer_opts]["background"]["options"]
    end

    it "should not allow to create layers of unkown types" do
      l = Layer.new(:kind => "wadus")
      expect { l.save }.to raise_error(Sequel::ValidationFailed)
    end

    it "should allow to be linked to many maps" do
      table2 = Table.new
      table2.user_id = @user.id
      table2.save
      layer = Layer.create(:kind => 'carto')
      map   = Map.create(:user_id => @user.id, :table_id => @table.id)
      map2  = Map.create(:user_id => @user.id, :table_id => table2.id)

      map.add_layer(layer)
      map2.add_layer(layer)

      map.layers.first.id.should  == layer.id
      map2.layers.first.id.should == layer.id
      layer.maps.should include(map, map2)
    end

    it "should allow to be linked to many users" do
      layer = Layer.create(:kind => 'carto')
      layer.add_user(@user)

      @user.reload.layers.map(&:id).should include(layer.id)
      layer.users.map(&:id).should include(@user.id)
    end

    it "should set default order when adding layers to a map" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      5.times do |i|
        layer = Layer.create(:kind => 'carto')
        map.add_layer(layer)
        layer.reload.order.should == i
      end
    end

    it "should set default order when adding layers to a user" do
      5.times do |i|
        layer = Layer.create(:kind => 'carto')
        @user.add_layer(layer)
        layer.reload.order.should == i
      end
    end

    context "when the type is cartodb and the layer is updated" do
      before do
        @map = Map.create(user_id: @user.id, table_id: @table.id)
        @layer = Layer.create(kind: 'carto', options: { query: "select * from #{@table.name}" })
        @map.add_layer(@layer)
      end

      it "should invalidate its maps" do
        CartoDB::Varnish.any_instance.stubs(:purge).returns(true)

        @layer.maps.each do |map|
          map.expects(:invalidate_vizjson_varnish_cache).times(1)
        end

        vizjson_key = @layer.affected_tables.first.table_visualization.varnish_vizjson_key
        CartoDB::Varnish.any_instance.expects(:purge).at_least(1).with(vizjson_key.to_s).returns(true)

        @layer.save
      end
    end

    context "when the type is not cartodb" do
      before do
        @map = Map.create(user_id: @user.id, table_id: @table.id)
        @layer = Layer.create(kind: 'tiled')
        @map.add_layer(@layer)
      end

      it "should not invalidate its related tables varnish cache" do
        @layer.maps.each do |map|
          map.expects(:invalidate_vizjson_varnish_cache).times(1)
        end

        @layer.affected_tables.each do |table|
          table.expects(:update_cdb_tablemetadata).times(0)
        end

        @layer.save
      end
    end

    it "should update updated_at after saving" do
      layer = Layer.create(:kind => 'carto')
      after = layer.updated_at
      Delorean.jump(1.minute)
      after.should < layer.save.updated_at
      Delorean.back_to_the_present
    end

    it "should correctly identify affected tables" do
      table2 = Table.new
      table2.user_id = @user.id
      table2.save
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      layer = Layer.create(
        kind: 'carto',
        options: { query: "select * from #{@table.name}, #{table2.name};select 1;select * from #{table2.name}" }
      )
      map.add_layer(layer)

      layer.affected_tables.map(&:name).should =~ [table2.name, @table.name]
    end

    it "should return empty affected tables when no tables are involved" do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      layer = Layer.create(
        kind: 'carto',
        options: { query: "select 1" }
      )
      map.add_layer(layer)

      layer.affected_tables.map(&:name).should =~ []
    end

    it 'includes table_name option in the results' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      layer = Layer.create(
        kind: 'carto',
        options: { query: "select 1", table_name: @table.name }
      )
      map.add_layer(layer)

      layer.affected_tables.map(&:name).should =~ [@table.name]
    end
  end

  context "redis syncs" do
    pending "should have a unique key to be identified in Redis" do
      layer = Layer.create(:kind => 'carto', :options => { :style => 'wadus' })
      layer.key.should == "rails:layer_styles:#{layer.id}"
    end

    pending "should store styles in Redis" do
      layer = Layer.create(:kind => 'carto', :options => { :style => 'wadus' })

      $layers_metadata.hget(layer.key,"style").should == "wadus"
    end

    pending "should remove the metadata from Redis when removing the layer" do
      layer = Layer.create(:kind => 'carto', :options => { :style => 'wadus' })
      $layers_metadata.exists(layer.key).should be_true
      layer.destroy
      $layers_metadata.exists(layer.key).should be_false
    end
  end

  describe '#copy' do
    it 'returns a copy of the layer' do
      layer       = Layer.new(kind: 'carto', options: { style: 'bogus' }).save
      layer_copy  = layer.copy

      layer_copy.kind.should    == layer.kind
      layer_copy.options.should == layer.options
      layer_copy.id.should be_nil
    end
  end

  describe '#base_layer?' do
    it 'returns true if its kind is a base layer' do
      layer = Layer.new(kind: 'tiled')
      layer.base_layer?.should == true
    end
  end

  describe '#data_layer?' do
    it 'returns true if its of a carto kind' do
      layer = Layer.new(kind: 'carto')
      layer.data_layer?.should == true
    end
  end

  describe '#rename_table' do
    it 'renames table in layer options' do
      table_name      = 'table_name'
      new_table_name  = 'changed_name'

      tile_style      = "##{table_name} { color:red; }"
      query           = "SELECT * FROM table_name, other_table"
      options         = {
                          table_name: table_name,
                          tile_style: tile_style,
                          query:      query
                        }

      layer           = Layer.create(kind: 'carto', options: options)
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
      options         = {
                          table_name: table_name,
                          tile_style: tile_style,
                          query:      query
                        }
      layer           = Layer.create(kind: 'carto', options: options)
      layer.rename_table(table_name, new_table_name)
      layer.save
      layer.reload

      layer.options.fetch('query').should == options.fetch(:query)
    end
  end

  describe '#before_destroy' do
    it 'invalidates the vizjson cache of all related maps' do
      map   = Map.create(:user_id => @user.id, :table_id => @table.id)
      layer = Layer.create(kind: 'carto')
      map.add_layer(layer)

      layer.maps.each { |map| map.expects(:invalidate_vizjson_varnish_cache) }
      layer.destroy
    end
  end

  describe '#uses_private_tables?' do
    it 'returns true if any of the affected tables is private' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(get: nil, create: true, update: true)

      map = Map.create(user_id: @user.id, table_id: @table.id)
      source = @table.table_visualization
      derived = CartoDB::Visualization::Copier.new(@user, source).copy
      derived.store

      derived.layers(:cartodb).length.should == 1
      derived.layers(:cartodb).first.uses_private_tables?.should be_true
      @table.privacy = UserTable::PRIVACY_PUBLIC
      @table.save
      @user.reload

      derived.layers(:cartodb).first.uses_private_tables?.should be_false
    end
  end
end
