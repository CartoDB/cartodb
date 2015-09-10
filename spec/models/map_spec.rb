# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/models/map'
require_relative '../../app/models/visualization/member'

describe Map do
  before(:each) do
    User.any_instance.stubs(:enable_remote_db_user).returns(true)
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

    @table = Table.new
    @table.user_id = $user_1.id
    @table.save
  end

  describe '#bounds' do
    it 'checks max-min bounds' do
      new_map = Map.create(user_id: $user_1.id, table_id: @table.id)

      max_value= :maxlon  # 179
      min_value= :minlon  # -179
      value1 = 5
      value2 = 179
      value3 = -179
      value4 = 180
      value5 = -180
      value6 = 0

      new_map.send(:bound_for, value1, min_value, max_value).should eq value1
      new_map.send(:bound_for, value2, min_value, max_value).should eq value2
      new_map.send(:bound_for, value2, min_value, max_value).should eq Map::DEFAULT_BOUNDS[max_value]
      new_map.send(:bound_for, value3, min_value, max_value).should eq value3
      new_map.send(:bound_for, value3, min_value, max_value).should eq Map::DEFAULT_BOUNDS[min_value]
      new_map.send(:bound_for, value4, min_value, max_value).should eq Map::DEFAULT_BOUNDS[max_value]
      new_map.send(:bound_for, value5, min_value, max_value).should eq Map::DEFAULT_BOUNDS[min_value]
      new_map.send(:bound_for, value6, min_value, max_value).should eq value6

      # As map has no geometries, bounds should still be default ones instead of zeros
      map_bounds = new_map.send(:get_map_bounds)
      default_bounds = new_map.send(:default_map_bounds)

      map_bounds[:maxx].should eq default_bounds[:max][0]
      map_bounds[:maxy].should eq default_bounds[:max][1]
      map_bounds[:minx].should eq default_bounds[:min][0]
      map_bounds[:miny].should eq default_bounds[:min][1]


      new_map.destroy
    end
  end

  describe '#tables' do
    it 'returns the associated tables' do
      map = Map.create(user_id: $user_1.id, table_id: @table.id)
      @table.reload
      map.reload
      map.tables.map(&:id).should include(@table.id)
      map.destroy
    end

    it 'updates associated tables/vis upon change' do
      map = Map.create(user_id: $user_1.id, table_id: @table.id)
      @table.reload

      CartoDB::Visualization::Member.new(
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        name:     'wadus',
        type:     CartoDB::Visualization::Member::TYPE_CANONICAL,
        user_id:  $user_1.id,
        map_id:   map.id
      ).store

      map2 = Map.create(user_id: $user_1.id, table_id: @table.id)
      # Change map_id on the table, but visualization still points to old map.id
      @table.map_id = map2.id
      @table.save

      # Upon save of the original map, will sanitize all visualizations pointing to old one, saving with new one
      CartoDB::Visualization::Member.any_instance.expects(:store_from_map)
      map.save

      map.destroy
      map2.destroy
    end
  end

  describe '#base_layers' do
    it 'returns the associated base layer' do
      map = Map.create(user_id: $user_1.id, table_id: @table.id)
      base_layer = Layer.create(kind: 'carto')
      map.add_layer(base_layer)
      5.times { map.add_layer(Layer.create(kind: 'carto')) }

      map.reload.base_layers.first.id.should == base_layer.id
      map.destroy
    end
  end

  describe 'data_layers' do
    it 'returns the associated data layers' do
      map = Map.create(user_id: $user_1.id, table_id: @table.id)
      5.times { map.add_layer(Layer.create(kind: 'tiled')) }
      data_layer = Layer.create(kind: 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.id.should == data_layer.id
      map.destroy
    end
  end

  describe '#user_layers' do
    it 'returns all user-defined layers' do
      map = Map.create(user_id: $user_1.id, table_id: @table.id)
      5.times { map.add_layer(Layer.create(kind: 'tiled')) }
      data_layer = Layer.create(kind: 'carto')
      map.add_layer(data_layer)

      map.reload.base_layers.length.should == 6
      map.reload.user_layers.length.should == 5
      map.destroy
    end
  end

  describe '#after_save' do
    it 'invalidates varnish cache' do
      map = @table.map
      # One per save, one per destroy
      map.expects(:invalidate_vizjson_varnish_cache).twice()
      map.save
      map.destroy
    end

    it "recalculates bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'Madrid Bars', :tags => 'movies, personal'
      table.user_id = $user_1.id
      table.force_schema = "name text, address text, latitude float, longitude float"
      table.save
      table.insert_row!({:name => "Hawai", :address => "Calle de Pérez Galdós 9, Madrid, Spain", :latitude => 40.423012, :longitude => -3.699732})
      table.insert_row!({:name => "El Estocolmo", :address => "Calle de la Palma 72, Madrid, Spain", :latitude => 40.426949, :longitude => -3.708969})
      table.insert_row!({:name => "El Rey del Tallarín", :address => "Plaza Conde de Toreno 2, Madrid, Spain", :latitude => 40.424654, :longitude => -3.709570})
      table.insert_row!({:name => "El Lacón", :address => "Manuel Fernández y González 8, Madrid, Spain", :latitude => 40.415113, :longitude => -3.699871})
      table.insert_row!({:name => "El Pico", :address => "Calle Divino Pastor 12, Madrid, Spain", :latitude => 40.428198, :longitude => -3.703991})
      table.reload
      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
      table.optimize

      table.map.recalculate_bounds!
      table.map.view_bounds_ne.should == "[40.428198, -3.699732]"
      table.map.view_bounds_sw.should == "[40.415113, -3.70957]"
    end

    it "recenters map using bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'bounds tests', :tags => 'testing'
      table.user_id = $user_1.id
      table.force_schema = "name text, latitude float, longitude float"
      table.save
      table.insert_row!({:name => "A", :latitude => 40.0, :longitude => -20.0})
      table.insert_row!({:name => "B", :latitude => 80.0, :longitude => 30.0})
      table.reload
      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
      table.optimize
      table.map.recalculate_bounds!

      table.map.recenter_using_bounds!

      # casting to string :_( but currently only used by frontend
      table.map.center_data.should == [ 60.0.to_s, 5.0.to_s ]
    end

    it "recalculates zoom using bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'zoom recalc test'
      table.user_id = $user_1.id
      table.force_schema = "name text, latitude float, longitude float"
      table.save

      # Out of usual bounds by being bigger than "full world bounding box"
      table.map.stubs(:get_map_bounds)
               .returns({ minx: -379, maxx: 379, miny: -285 , maxy: 285.0511})
      table.map.recalculate_zoom!
      table.map.zoom.should == 1

      table.map.stubs(:get_map_bounds)
               .returns({ minx: -179, maxx: 179, miny: -85 , maxy: 85.0511})
      table.map.recalculate_zoom!
      table.map.zoom.should == 1

      table.map.stubs(:get_map_bounds)
               .returns({ minx: 1, maxx: 2, miny: 1 , maxy: 2})
      table.map.recalculate_zoom!
      table.map.zoom.should == 8

      table.map.stubs(:get_map_bounds)
               .returns({ minx: 0.025, maxx: 0.05, miny: 0.025 , maxy: 0.05})
      table.map.recalculate_zoom!
      table.map.zoom.should == 14

      # Smaller than our max zoom level
      table.map.stubs(:get_map_bounds)
               .returns({ minx: 0.000001, maxx: 0.000002, miny: 0.000001 , maxy: 0.000002})
      table.map.recalculate_zoom!
      table.map.zoom.should == 18

    end
  end

  describe '#updated_at' do
    it 'is updated after saving the map' do
      map         = Map.create(user_id: $user_1.id, table_id: @table.id)
      updated_at  = map.updated_at

      sleep 0.5
      map.save
      map.updated_at.should > updated_at
      map.destroy
    end
  end

  describe '#admits?' do
    it 'checks base layer admission rules' do
      map   = Map.create(user_id: $user_1.id, table_id: @table.id)

      # First base layer is always allowed
      layer = Layer.new(kind: 'tiled')
      map.admits_layer?(layer).should == true
      map.add_layer(layer)
      map.save.reload

      map.add_layer(Layer.new(kind: 'carto', order: 5))
      map.save.reload

      second__tiled_layer = Layer.new(kind: 'tiled')
      # more tiled layers allowed only if at top
      second__tiled_layer.order = 0
      map.admits_layer?(second__tiled_layer).should == false
      second__tiled_layer.order = 15
      map.admits_layer?(second__tiled_layer).should == true
      map.add_layer(layer)
      map.save.reload

      # This is now a valid scenario, for example switcing from a basemap with labels on top to another that has too
      third_layer = Layer.new(kind: 'tiled', order: 15)
      map.admits_layer?(third_layer).should == true
      third_layer.order = 100
      map.admits_layer?(third_layer).should == true

      map.destroy
    end

    describe 'when linked to a table visualization' do
      it 'returns false when passed a data layer and it is already linked to a base layer' do
        map = @table.map
        map.remove_layer(map.data_layers.first)
        map.reload

        map.admits_layer?(Layer.new(kind: 'carto')).should == true
        map.add_layer(Layer.new(kind: 'carto'))
        map.save.reload

        map.admits_layer?(Layer.new(kind: 'carto')).should == false
      end
    end
  end

  it "should correcly set vizjson updated_at" do
    map = Map.create(user_id: $user_1.id, table_id: @table.id)

    # When the table data is newer
    time = Time.now + 2.minutes
    Table.any_instance.stubs(:data_last_modified).returns(time)
    map.viz_updated_at.to_s.should == time.to_s

    # When the data layer is newer
    time = Time.now + 3.minutes
    map.stubs(:data_layers).returns([Layer.new(updated_at: time)])
    map.viz_updated_at.to_s.should == time.to_s
  end

  describe '#before_destroy' do
    it 'invalidates varnish cache' do
      map = @table.map
      map.expects(:invalidate_vizjson_varnish_cache)
      map.destroy
    end
  end

  describe '#process_privacy_in' do
    it 'sets related visualization private if layer uses private tables' do

      pending("To be checked when private tables are coded")

      @table1 = Table.new
      @table1.user_id = $user_1.id
      @table1.save

      @table2 = Table.new
      @table2.user_id = $user_1.id
      @table2.save

      source  = @table1.table_visualization
      derived = CartoDB::Visualization::Copier.new($user_1, source).copy
      derived.store

      derived.layers(:cartodb).length.should == 1
      @table1.privacy = UserTable::PRIVACY_PUBLIC
      @table1.save
      derived.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
      derived.store

      derived.fetch.private?.should be_false

      layer = Layer.create(
        kind:     'carto',
        options:  { table_name: @table2.name }
      )
      layer.add_map(derived.map)
      layer.save
      layer.reload
      $user_1.reload

      layer.uses_private_tables?.should be_true

      derived.map.process_privacy_in(layer)
      derived.fetch.private?.should be_true
    end
  end
end

