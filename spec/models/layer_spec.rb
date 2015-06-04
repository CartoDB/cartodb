require 'spec_helper'

describe Layer do

  before(:all) do
    @quota_in_bytes = 500.megabytes
    @table_quota = 500
    @user = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota, :private_tables_enabled => true)
  end

  after(:all) do
    # Using Mocha stubs until we update RSpec (@see http://gofreerange.com/mocha/docs/Mocha/ClassMethods.html)
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    @user.destroy
  end

  before(:each) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)

    CartoDB::Overlay::Member.any_instance.stubs(:can_store).returns(true)

    delete_user_data @user
    @table = Table.new
    @table.user_id = @user.id
    @table.save
  end

  context "setups" do

    it "should be preloaded with the correct default values" do
      l = Layer.create(Cartodb.config[:layer_opts]["data"]).reload
      l.kind.should == 'carto'
      l.options.should == Cartodb.config[:layer_opts]["data"]["options"]
      l = Layer.create(Cartodb.config[:layer_opts]["background"]).reload
      l.kind.should == 'background'
      l.options.should == Cartodb.config[:layer_opts]["background"]["options"]
      l = Layer.create(Cartodb.config[:layer_opts]["base"]).reload
      l.kind.should == 'tiled'
      l.options.should == Cartodb.config[:layer_opts]["base"]["options"]
      l = Layer.create(Cartodb.config[:layer_opts]["gmaps"]).reload
      l.kind.should == 'gmapsbase'
      l.options.should == Cartodb.config[:layer_opts]["gmaps"]["options"]
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
        @map = Map.create(:user_id => @user.id, :table_id => @table.id)
        @layer = Layer.create(kind: 'carto', options: { query: "select * from #{@table.name}" })
        @map.add_layer(@layer)
      end

      it "should invalidate its maps and related tables varnish cache" do
        @layer.maps.each do |map|
          map.expects(:invalidate_vizjson_varnish_cache).times(1)
        end

        key = @layer.affected_tables.first.service.varnish_key
        CartoDB::Varnish.any_instance.expects(:purge).times(1).with("#{key}").returns(true)

        vizzjson_key = @layer.affected_tables.first.table_visualization.varnish_vizzjson_key
        CartoDB::Varnish.any_instance.expects(:purge).times(1).with("#{vizzjson_key}").returns(true)

        @layer.save
      end
    end

    context "when the type is not cartodb" do
      before do
        @map = Map.create(:user_id => @user.id, :table_id => @table.id)
        @layer = Layer.create(kind: 'tiled')
        @map.add_layer(@layer)
      end

      it "should not invalidate its related tables varnish cache" do
        @layer.maps.each do |map|
          map.expects(:invalidate_vizjson_varnish_cache).times(1)
        end

        @layer.affected_tables.each do |table|
          table.expects(:invalidate_varnish_cache).times(0)
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
  end #base_layer?

  describe '#data_layer?' do
    it 'returns true if its of a carto kind' do
      layer = Layer.new(kind: 'carto')
      layer.data_layer?.should == true
    end
  end #data_layer?

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
  end #rename_table

  describe '#before_destroy' do
    it 'invalidates the vizjson cache of all related maps' do
      map   = Map.create(:user_id => @user.id, :table_id => @table.id)
      layer = Layer.create(kind: 'carto')
      map.add_layer(layer)

      layer.maps.each { |map| map.expects(:invalidate_vizjson_varnish_cache) }
      layer.destroy
    end
  end #before_destroy

  describe '#uses_private_tables?' do
    it 'returns true if any of the affected tables is private' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      map     = Map.create(:user_id => @user.id, :table_id => @table.id)
      source  = @table.table_visualization
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

  describe '#parent_id' do
    it 'checks parent_id works as expected' do
      parent_layer = Layer.create(kind: 'carto')

      parent_layer.parent_id.nil?.should eq true
      parent_layer.children.should eq Array.new

      child_layer = Layer.create(kind: 'carto')

      child_layer.parent_id = parent_layer.id
      child_layer.save

      child_layer = Layer.where(id:child_layer.id).first
      child_layer.parent_id.nil?.should eq false
      child_layer.parent_id.should eq parent_layer.id

      child_layer.parent.nil?.should eq false
      child_layer.parent.id.should eq parent_layer.id

      parent_layer = Layer.where(id: parent_layer.id).first
      parent_layer.children.count.should eq 1
      parent_layer.children.first.id.should eq child_layer.id
    end

    it 'checks deletion removes also children' do
      Layer.all.each do |layer|
        begin
        layer.destroy
        rescue
          # just keep going, some layers might not have been saved to DB
        end
      end

      parent_layer = Layer.create(kind: 'carto')
      child_layer_1 = Layer.create(kind: 'carto', parent_id: parent_layer.id)
      child_layer_2 = Layer.create(kind: 'carto', parent_id: parent_layer.id)
      child_layer_3 = Layer.create(kind: 'carto', parent_id: parent_layer.id)

      other_parent_layer = Layer.create(kind: 'carto')

      Layer.all.count.should eq 5

      parent_layer.destroy

      Layer.all.count.should eq 1
      Layer.all.first.id.should eq other_parent_layer.id
    end
  end
end
