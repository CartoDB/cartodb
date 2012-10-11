require 'spec_helper'

describe Map do

  before(:all) do
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
  end

  before(:each) do
    @table = Table.new
    @table.user_id = @user.id
    @table.save
  end

  context "setups" do

    it "should allow to be linked to a table" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      map.reload
      @table.reload

      @table.map.should == map
      map.tables.should include(@table)
    end

    it "should correctly identify the base layer" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      base_layer = Layer.create(:kind => 'carto')
      map.add_layer(base_layer)
      5.times { map.add_layer(Layer.create(:kind => 'carto')) }

      map.reload.base_layers.first.should == base_layer
    end

    it "should correctly identify the data layers" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      5.times { map.add_layer(Layer.create(:kind => 'tiled')) }
      data_layer = Layer.create(:kind => 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.should == data_layer
    end

    it "should remove its vizzjson from varnish after being modified" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}:vizjson").returns(true)
      map.save
    end

    context "when more than one table is involved" do
      before do
        @map = Map.create(:user_id => @user.id, :table_id => @table.id)
        @table2 = Table.new
        @table2.user_id = @user.id
        @table2.save

        @layer = Layer.create(:kind => 'carto', :options => { "query" => "select cartodb_id from #{@table.name} where cartodb_id in (select cartodb_id from #{@table2.name})" })
        @layer.add_map(@map)
      end

      it "should correctly identify affected tables" do
        @map.affected_tables.map(&:name).should == [@table.name, @table2.name]
      end

      it "should remove all the affected tables from varnish after being modified" do
        # Three purge calls: one for vizzjson and two for the affected tables
        CartoDB::Varnish.any_instance.expects(:purge).times(3).returns(true)
        @map.save
      end
    end

  end
end
