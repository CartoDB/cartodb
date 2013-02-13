# coding: UTF-8
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

      map.reload.base_layers.first.id.should == base_layer.id
    end

    it "should correctly identify the data layers" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      5.times { map.add_layer(Layer.create(:kind => 'tiled')) }
      data_layer = Layer.create(:kind => 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.id.should == data_layer.id
    end

    it "should remove its vizzjson from varnish after being modified" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      CartoDB::Varnish.any_instance.expects(:purge).times(1).with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}:vizjson").returns(true)
      CartoDB::Varnish.any_instance.expects(:purge).times(0).with("obj.http.X-Cache-Channel ~ #{@table.varnish_key}.*")
      map.save
    end

    it "should correctly recalculate bounds" do
      table = Table.new :privacy => Table::PRIVATE, :name => 'Madrid Bars',
                        :tags => 'movies, personal'
      table.user_id = @user.id
      table.force_schema = "name text, address text, latitude float, longitude float"
      table.save
      table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9, Madrid, Spain", :latitude => 40.423012, :longitude => -3.699732})
      table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid, Spain", :latitude => 40.426949, :longitude => -3.708969})
      table.insert_row!({:name => "El Rey del Tallarín", :address => "Plaza Conde de Toreno 2, Madrid, Spain", :latitude => 40.424654, :longitude => -3.709570})
      table.insert_row!({:name => "El Lacón", :address => "Manuel Fernández y González 8, Madrid, Spain", :latitude => 40.415113, :longitude => -3.699871})
      table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid, Spain", :latitude => 40.428198, :longitude => -3.703991})
      table.reload
      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
      table.map.recalculate_bounds!
      table.map.view_bounds_ne.should == "[40.428198, -3.699732]"
      table.map.view_bounds_sw.should == "[40.415113, -3.70957]"
    end

    it "should update updated_at after saving" do
      map = Map.create(:user_id => @user.id, :table_id => @table.id)
      after = map.updated_at
      sleep 1
      after.should < map.save.updated_at
    end

    it "should correcly set vizjson updated_at" do
      map = Map.create(user_id: @user.id, table_id: @table.id)

      # When the table data is newer
      t = Time.now + 2.minutes
      Table.any_instance.stubs(:data_last_modified).returns(t)
      map.viz_updated_at.to_s.should == t.to_s

      # When the map is newer
      t = Time.now + 3.minutes
      map.stubs(:updated_at).returns(t)
      map.viz_updated_at.to_s.should == t.to_s
    end
  end
end
