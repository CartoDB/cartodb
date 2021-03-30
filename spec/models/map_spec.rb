require_relative '../spec_helper'
require_relative '../../app/models/map'
require_relative '../../app/models/visualization/member'
require_dependency 'carto/bounding_box_utils'

describe Map do
  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    bypass_named_maps

    @user = create(:valid_user, private_tables_enabled: true)
    @table = create_table(user_id: @user.id)
  end

  after(:each) do
    @table.destroy
    @user.destroy
  end

  describe 'viewer role support' do
    describe '#save' do
      it 'should fail for viewer users' do
        @user.stubs(:viewer).returns(true)
        new_map = Map.new(user: @user, table_id: @table.id)

        new_map.save.should eq nil
        new_map.errors[:user].should eq ["Viewer users can't save maps"]

        @user.stubs(:viewer).returns(false)
      end
    end

    describe '#update' do
      it 'should fail for existing maps and viewer users' do
        new_map = Map.create(user_id: @user.id, table_id: @table.id)
        new_map.user.stubs(:viewer).returns(true)

        new_map.save.should eq nil
        new_map.errors[:user].should eq ["Viewer users can't save maps"]

        new_map.user.stubs(:viewer).returns(false)
        new_map.destroy
      end
    end

    describe '#validations' do
      before(:all) do
        @map_user = create(:carto_user)
        @map = Carto::Map.create(user_id: @map_user.id)
      end

      after(:all) do
        @map.destroy
        @map_user.destroy
      end

      describe '#options' do
        it 'sets dashboard_menu true by default' do
          @map.dashboard_menu.should eq true
        end

        it 'sets layer_selector false by default' do
          @map.layer_selector.should eq false
        end

        it 'allows to change dashboard_menu' do
          @map.dashboard_menu = false
          @map.dashboard_menu.should be_false

          @map.dashboard_menu = true
          @map.dashboard_menu.should be_true
        end

        it 'allows to change layer_selector' do
          @map.layer_selector = false
          @map.layer_selector.should be_false

          @map.layer_selector = true
          @map.layer_selector.should be_true
        end

        it 'rejects a non-boolean dashboard_menu value' do
          @map.dashboard_menu = 'patata'

          @map.valid?.should be_false
          @map.errors[:options][0].should include('String did not match the following type: boolean')
        end

        it 'rejects a non-boolean layer_selector value' do
          @map.layer_selector = 'patata'

          @map.valid?.should be_false
          @map.errors[:options][0].should include('String did not match the following type: boolean')
        end

        it 'requires a dashboard_menu value' do
          @map.dashboard_menu = nil

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('NilClass did not match the following type: boolean')
        end

        it 'requires a layer_selector value' do
          @map.layer_selector = nil

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('NilClass did not match the following type: boolean')
        end

        it 'requires dashboard_menu to be present' do
          old_options = @map.options.dup
          @map.options = Hash.new

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('did not contain a required property of \'dashboard_menu\'')

          @map.options = old_options
        end

        it 'requires layer_selector to be present' do
          old_options = @map.options.dup
          @map.options = Hash.new

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('did not contain a required property of \'layer_selector\'')

          @map.options = old_options
        end

        it 'rejects spammy options' do
          @map.options[:spam] = 'hell'

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('spam')
        end

        it 'rejects incomplete options' do
          @map.options.delete(:dashboard_menu)

          @map.valid?.should be_false
          @map.errors[:options].should_not be_empty
          @map.errors[:options][0].should include('dashboard_menu')
        end
      end
    end

    describe '#destroy' do
      it 'should fail for existing maps and viewer users' do
        new_map = Map.create(user_id: @user.id, table_id: @table.id)
        new_map.user.stubs(:viewer).returns(true)

        expect { new_map.destroy }.to raise_error(CartoDB::InvalidMember, /Viewer users can't destroy maps/)

        new_map.user.stubs(:viewer).returns(false)
        new_map.destroy
      end
    end
  end

  describe '#bounds' do
    it 'checks max-min bounds' do
      new_map = Map.create(user_id: @user.id, table_id: @table.id)

      max_value = :maxx  # 179
      min_value = :minx  # -179
      value1 = 5
      value2 = 179
      value3 = -179
      value4 = 180
      value5 = -180
      value6 = 0

      Carto::BoundingBoxUtils.bound_for(value1, min_value, max_value).should eq value1
      Carto::BoundingBoxUtils.bound_for(value2, min_value, max_value).should eq value2
      Carto::BoundingBoxUtils.bound_for(value2, min_value, max_value).should eq Carto::BoundingBoxUtils::DEFAULT_BOUNDS[max_value]
      Carto::BoundingBoxUtils.bound_for(value3, min_value, max_value).should eq value3
      Carto::BoundingBoxUtils.bound_for(value3, min_value, max_value).should eq Carto::BoundingBoxUtils::DEFAULT_BOUNDS[min_value]
      Carto::BoundingBoxUtils.bound_for(value4, min_value, max_value).should eq Carto::BoundingBoxUtils::DEFAULT_BOUNDS[max_value]
      Carto::BoundingBoxUtils.bound_for(value5, min_value, max_value).should eq Carto::BoundingBoxUtils::DEFAULT_BOUNDS[min_value]
      Carto::BoundingBoxUtils.bound_for(value6, min_value, max_value).should eq value6

      # As map has no geometries, bounds should still be default ones instead of zeros
      new_map.send(:get_map_bounds).should be_nil

      new_map.destroy
    end
  end

  describe '#tables' do
    it 'returns the associated tables' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      @table.reload
      map.reload
      map.tables.map(&:id).should include(@table.id)
      map.destroy
    end

    it 'updates associated tables/vis upon change' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      @table.reload

      CartoDB::Visualization::Member.new(
        privacy:  CartoDB::Visualization::Member::PRIVACY_PUBLIC,
        name:     'wadus',
        type:     CartoDB::Visualization::Member::TYPE_CANONICAL,
        user_id:  @user.id,
        map_id:   map.id
      ).store

      map2 = Map.create(user_id: @user.id, table_id: @table.id)
      # Change map_id on the table, but visualization still points to old map.id
      @table.map_id = map2.id
      @table.save

      # Upon save of the original map, will sanitize all visualizations pointing to old one, saving with new one
      CartoDB::Visualization::Member.any_instance.expects(:store_from_map).at_least_once
      map.save

      map.destroy
      map2.destroy
    end
  end

  describe '#base_layers' do
    it 'returns the associated base layer' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      base_layer = Layer.create(kind: 'carto')
      map.add_layer(base_layer)
      5.times { map.add_layer(Layer.create(kind: 'carto')) }

      map.reload.base_layers.first.id.should == base_layer.id
      map.destroy
    end
  end

  describe 'data_layers' do
    it 'returns the associated data layers' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      5.times { map.add_layer(Layer.create(kind: 'tiled')) }
      data_layer = Layer.create(kind: 'carto')
      map.add_layer(data_layer)

      map.reload.data_layers.first.id.should == data_layer.id
      map.destroy
    end
  end

  describe '#user_layers' do
    it 'returns all user-defined layers' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
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
      map = ::Map[@table.map.id]
      # One per save, one per destroy
      map.expects(:invalidate_vizjson_varnish_cache).twice
      map.save
      map.destroy
    end

    it "recalculates bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'Madrid Bars', :tags => 'movies, personal'
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
      table.optimize

      table.map.recalculate_bounds!
      table.map.view_bounds_ne.should == "[40.4283, -3.69968]"
      table.map.view_bounds_sw.should == "[40.415, -3.70962]"
    end

    it "recenters map using bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'bounds tests', :tags => 'testing'
      table.user_id = @user.id
      table.force_schema = "name text, latitude float, longitude float"
      table.save
      table.insert_row!({:name => "A", :latitude => 40.0, :longitude => -20.0})
      table.insert_row!({:name => "B", :latitude => 80.0, :longitude => 30.0})
      table.reload
      table.georeference_from!(:latitude_column => :latitude, :longitude_column => :longitude)
      table.optimize
      table.map.set_default_boundaries!

      # casting to string :_( but currently only used by frontend
      table.map.center_data.should == [ 60.0.to_s, 5.0.to_s ]
    end

    it "recalculates zoom using bounds" do
      table = Table.new :privacy => UserTable::PRIVACY_PRIVATE, :name => 'zoom recalc test'
      table.user_id = @user.id
      table.force_schema = "name text, latitude float, longitude float"
      table.save

      # Out of usual bounds by being bigger than "full world bounding box"
      table.map.stubs(:get_map_bounds)
               .returns({ minx: -379, maxx: 379, miny: -285 , maxy: 285.0511})
      table.map.set_default_boundaries!
      table.map.zoom.should == 1

      table.map.stubs(:get_map_bounds)
               .returns({ minx: -179, maxx: 179, miny: -85 , maxy: 85.0511})
      table.map.set_default_boundaries!
      table.map.zoom.should == 1

      table.map.stubs(:get_map_bounds)
               .returns({ minx: 1, maxx: 2, miny: 1 , maxy: 2})
      table.map.set_default_boundaries!
      table.map.zoom.should == 8

      table.map.stubs(:get_map_bounds)
               .returns({ minx: 0.025, maxx: 0.05, miny: 0.025 , maxy: 0.05})
      table.map.set_default_boundaries!
      table.map.zoom.should == 14

      # Smaller than our max zoom level
      table.map.stubs(:get_map_bounds)
               .returns({ minx: 0.000001, maxx: 0.000002, miny: 0.000001 , maxy: 0.000002})
      table.map.set_default_boundaries!
      table.map.zoom.should == 18

    end
  end

  describe '#notify_map_change' do
    before(:each) do
      @map = Map.create(user_id: @user.id, table_id: @table.id)
      layer = Layer.new(kind: 'tiled')
      @map.add_layer(layer)
    end

    after(:each) do
      @map.destroy
    end

    it 'invalidates vizjson cache' do
      CartoDB::Varnish.any_instance.stubs(:purge).with(@map.visualization.varnish_vizjson_key).once
      @map.notify_map_change
      CartoDB::Varnish.any_instance.stubs(:purge) # Needed to avoid counting the call from destroy
    end

    it 'updates_named_maps' do
      named_maps_api_mock = mock
      Carto::NamedMaps::Api.stubs(:new).with { |vis| vis.id == @map.visualization.id }.returns(named_maps_api_mock)
      named_maps_api_mock.stubs(:show).returns(true)
      named_maps_api_mock.stubs(:update).once
      @map.notify_map_change
      Carto::NamedMaps::Api.unstub(:new)
    end
  end

  describe '#updated_at' do
    it 'is updated after saving the map' do
      map         = Map.create(user_id: @user.id, table_id: @table.id)
      updated_at  = map.updated_at

      sleep 0.5
      map.save
      map.updated_at.should > updated_at
      map.destroy
    end
  end

  describe '#can_add_layer?' do
    it 'should only take into account data layers' do
      map = Map.create(user_id: @user.id, table_id: @table.id)
      @user.max_layers = 1
      @user.save.reload

      # First base layer is always allowed
      layer = Layer.new(kind: 'tiled')
      map.can_add_layer?(@user, layer).should == true
      map.add_layer(layer)
      map.save.reload

      layer_carto1 = Layer.new(kind: 'carto')
      map.can_add_layer?(@user, layer_carto1).should == true
      map.add_layer(layer_carto1)
      map.save.reload

      layer_carto2 = Layer.new(kind: 'carto')
      map.can_add_layer?(@user, layer_carto2).should == false

      # This is now a valid scenario, for example switcing from a basemap with labels on top to another that has too
      third_layer = Layer.new(kind: 'tiled', order: 15)
      map.can_add_layer?(@user, third_layer).should == true
      map.add_layer(third_layer)
      map.save.reload

      map.destroy
    end
  end

  describe '#admits?' do
    it 'checks base layer admission rules' do
      map   = Map.create(user_id: @user.id, table_id: @table.id)

      # First base layer is always allowed
      layer = Layer.new(kind: 'tiled')
      map.admits_layer?(layer).should == true
      map.add_layer(layer)
      map.save.reload

      map.add_layer(Layer.new(kind: 'carto', order: 5))
      map.save.reload

      second_tiled_layer = Layer.new(kind: 'tiled')
      # more tiled layers allowed only if at top
      second_tiled_layer.order = 0
      map.admits_layer?(second_tiled_layer).should == false
      second_tiled_layer.order = 15
      map.admits_layer?(second_tiled_layer).should == true
      map.add_layer(second_tiled_layer)
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
        map = ::Map[@table.map.id]
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
      map = ::Map[@table.map.id]
      map.expects(:invalidate_vizjson_varnish_cache)
      map.destroy
    end
  end

  describe '#process_privacy_in' do
    it 'sets related visualization private if layer uses private tables' do
      @table1 = Table.new
      @table1.user_id = @user.id
      @table1.save

      @table2 = Table.new
      @table2.user_id = @user.id
      @table2.save

      visualization = @table1.table_visualization

      visualization.data_layers.length.should eq 1
      @table1.privacy = UserTable::PRIVACY_PUBLIC
      @table1.save
      visualization.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
      visualization.store

      visualization.private?.should be_false

      layer = Carto::Layer.create(
        kind:     'carto',
        options:  { table_name: @table2.name }
      )
      layer.add_map(visualization.map)
      layer.save
      layer.reload
      @user.reload

      layer.uses_private_tables?.should be_true

      visualization.map.process_privacy_in(layer)
      visualization.private?.should be_true
    end
  end

  context 'viewer role support on layer management' do
    after(:each) do
      @user.viewer = false
      @user.save
      @user.reload

      @map.reload && @map.destroy if @map
    end

    def become_viewer(user)
      user.viewer = true
      user.save
      user.reload
    end

    describe 'add layers' do
      it 'should fail for viewer users' do
        @map = Map.create(user_id: @user.id, table_id: @table.id)

        become_viewer(@user)
        @map.reload

        @layer = Layer.create(kind: 'carto', options: { query: "select * from #{@table.name}" })
        expect { @map.add_layer(@layer) }.to raise_error(/Viewer users can't edit layers/)
      end
    end

    describe 'remove layers' do
      it 'should fail for viewer users' do
        @map = Map.create(user_id: @user.id, table_id: @table.id)

        layer = Layer.create(kind: 'carto', options: { table_name: @table.name })
        layer.add_map(@map)
        layer.save
        layer.reload
        @map.reload

        @map.layers_dataset.where(layer_id: layer.id).should_not be_empty

        become_viewer(@user)
        expect {
          @map.layers_dataset.where(layer_id: layer.id).destroy
        }.to raise_error(/Viewer users can't destroy layers/)
        @map.reload
        @map.layers_dataset.where(layer_id: layer.id).should_not be_empty
      end
    end

    describe 'can_add_layer?' do
      it 'should return false for viewer users' do
        @map = Map.create(user_id: @user.id, table_id: @table.id)

        become_viewer(@user)
        @map.reload

        layer = Layer.create(kind: 'carto', options: { table_name: @table.name })
        @map.can_add_layer?(@user, layer).should eq false
      end
    end
  end
end
