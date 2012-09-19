require 'spec_helper'

describe Layer do

  before(:all) do
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
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
      layer = Layer.create(:kind => 'carto')
      map   = Map.create(:user_id => @user.id)
      map2  = Map.create(:user_id => @user.id)

      map.add_layer(layer)
      map2.add_layer(layer)

      map.layers.first.should  == layer
      map2.layers.first.should == layer
      layer.maps.should include(map, map2)
    end

    it "should allow to be linked to many users" do
      layer = Layer.create(:kind => 'carto')
      layer.add_user(@user)

      @user.reload.layers.should include(layer)
      layer.users.should include(@user)
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

end
