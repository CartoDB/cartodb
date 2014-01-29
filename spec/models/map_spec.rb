# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/models/map'

describe Map do
  before(:all) do
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user           = create_user(
                        quota_in_bytes: @quota_in_bytes,
                        table_quota:    @table_quota
                      )
  end

  after(:all) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    @user.destroy
  end

  before(:each) do
    # For Named Maps API wrapper
    # Using Mocha stubs until we update RSpec (@see http://gofreerange.com/mocha/docs/Mocha/ClassMethods.html)
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)

    @table = Table.new
    @table.user_id = @user.id
    @table.save
  end

  describe '#tables' do
    it 'returns the associated tables' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      @table.reload
      map.reload
      map.tables.should include(@table)
    end
  end #tables

  describe '#base_layers' do
    it 'returns the associated base layer' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      base_layer = Layer.create(kind: 'carto')
      map.add_layer(base_layer)
      5.times { map.add_layer(Layer.create(kind: 'carto')) }

      map.reload.base_layers.first.id.should == base_layer.id
    end
  end #base_layers

  describe 'data_layers' do
    it 'returns the associated data layers' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      5.times { map.add_layer(Layer.create(kind: 'tiled')) }
      data_layer = Layer.create(kind: 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.id.should == data_layer.id
    end
  end #data_layers

  describe '#user_layers' do
    it 'returns all user-defined layers' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      5.times { map.add_layer(Layer.create(kind: 'tiled')) }
      data_layer = Layer.create(kind: 'carto')
      map.add_layer(data_layer)

      map.reload.base_layers.length.should == 6
      map.reload.user_layers.length.should == 5
    end
  end #user_layers

  describe '#after_save' do
    it 'invalidates varnish cache' do
      map = @table.map
      map.expects(:invalidate_vizjson_varnish_cache)
      map.save
    end

    it "recalculates bounds" do
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
  end #after_save

  describe '#updated_at' do
    it 'is updated after saving the map' do
      map         = Map.create(user_id: @user.id, table_id: @table.id)
      updated_at  = map.updated_at

      sleep 0.5
      map.save
      map.updated_at.should > updated_at
    end
  end #updated_at

  describe '#admits?' do
    it 'returns false if passed a base layer
    and it is already linked to a a base layer' do
      map   = Map.create(user_id: @user.id, table_id: @table.id)
      layer = Layer.new(kind: 'tiled')

      map.admits_layer?(layer).should == true
      map.add_layer(layer)
      map.save.reload

      map.admits_layer?(Layer.new(kind: 'tiled')).should == false
    end

    describe 'when linked to a table visualization' do
      it 'returns false when passed a data layer
      and it is already linked to a base layer' do
        map = @table.map
        map.remove_layer(map.data_layers.first)
        map.reload

        map.admits_layer?(Layer.new(kind: 'carto')).should == true
        map.add_layer(Layer.new(kind: 'carto'))
        map.save.reload

        map.admits_layer?(Layer.new(kind: 'carto')).should == false
      end
    end

    describe 'when not linked to a table visualization' do
      it 'returns true when passed a data layer' do
        map = Map.create(user_id: @user.id, table_id: @table.id)

        map.add_layer(Layer.new(kind: 'carto'))
        map.admits_layer?(Layer.new(kind: 'carto')).should == true
        map.save.reload

        map.add_layer(Layer.new(kind: 'carto'))
        map.admits_layer?(Layer.new(kind: 'carto')).should == true
        map.save.reload

        map.add_layer(Layer.new(kind: 'carto'))
        map.admits_layer?(Layer.new(kind: 'carto')).should == true
      end
    end
  end #admits?

  it "should correcly set vizjson updated_at" do
    map = Map.create(user_id: @user.id, table_id: @table.id)

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
  end #before_destroy

  describe '#process_privacy_in' do
    it 'sets related visualization private if layer uses private tables' do

      pending("To be checked when private tables are coded")

      @table1 = Table.new
      @table1.user_id = @user.id
      @table1.save

      @table2 = Table.new
      @table2.user_id = @user.id
      @table2.save

      source  = @table1.table_visualization
      derived = CartoDB::Visualization::Copier.new(@user, source).copy
      derived.store

      derived.layers(:cartodb).length.should == 1
      @table1.privacy = 1
      @table1.save
      derived.privacy = 'public'
      derived.store

      derived.fetch.private?.should be_false

      layer = Layer.create(
        kind:     'carto',
        options:  { table_name: @table2.name }
      )
      layer.add_map(derived.map)
      layer.save
      layer.reload
      @user.reload

      layer.uses_private_tables?.should be_true

      derived.map.process_privacy_in(layer)
      derived.fetch.private?.should be_true
    end
  end #process_privacy_in
end

