require 'spec_helper'

describe Map do

  before(:all) do
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
  end

  context "layer setups" do

    it "should allow to be linked to a table" do
      table = Table.new
      table.user_id = @user.id
      table.save
      map = Map.create(:user_id => @user.id, :table_id => table.id)
      map.reload
      table.reload

      table.map.should == map
      map.tables.should include(table)
    end

    it "should correctly identify the base layer" do
      map = Map.create(:user_id => @user.id)
      base_layer = Layer.create(:kind => 'carto')
      map.add_layer(base_layer)
      5.times { map.add_layer(Layer.create(:kind => 'carto')) }
      map.reload.base_layers.first.should == base_layer
    end

    it "should correctly identify the data layers" do
      map = Map.create(:user_id => @user.id)
      5.times { map.add_layer(Layer.create(:kind => 'tiled')) }
      data_layer = Layer.create(:kind => 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.should == data_layer
    end

    it "should invalidate its vizzjson from varnish after being modified" do
      map = Map.create(:user_id => @user.id)
      CartoDB::Varnish.any_instance.expects(:purge).returns(true)
      map.center = "test"
      map.save
    end

  end
end
