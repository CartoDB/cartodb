require 'spec_helper'

describe Layer do

  before(:all) do
    @quota_in_bytes = 500.megabytes
    @table_quota = 500
    @user = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
  end

  before(:each) do
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
        CartoDB::Varnish.any_instance.expects(:purge).times(1)
          .with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}:vizjson").returns(true)
        CartoDB::Varnish.any_instance.expects(:purge).times(1)
          .with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}.*").returns(true)
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
        CartoDB::Varnish.any_instance.expects(:purge).times(1)
          .with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}:vizjson").returns(true)
        CartoDB::Varnish.any_instance.expects(:purge).times(0)
          .with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}.*").returns(true)
        @layer.save
      end
    end


    it "should update updated_at after saving" do
      layer = Layer.create(:kind => 'carto')
      after = layer.updated_at
      Timecop.travel Time.now + 1.minutes
      after.should < layer.save.updated_at
    end

    it "should correctly identify affected tables" do
      table2 = Table.new
      table2.user_id = @user.id
      table2.save
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      layer = Layer.create(
        kind: 'carto',
        options: { query: "select * from #{@table.name}, #{table2.name};select cartodb_id from unexisting_table;selecterror;select 1;select * from #{table2.name}" }
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
end
