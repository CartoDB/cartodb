#encoding: UTF-8
require_relative '../spec_helper'

CARTO_OPTIONS = '{"query":"","opacity":0.99,"auto_bound":false,"interactivity":"cartodb_id","debug":false,"visible":true,"tiler_domain":"localhost.lan","tiler_port":"80","tiler_protocol":"http","sql_domain":"localhost.lan","sql_port":"80","sql_protocol":"http","extra_params":{"cache_policy":"persist"},"cdn_url":"","tile_style_history":[],"style_version":"2.1.1","table_name":"districtes_barcelona","user_name":"ethervoid-common","tile_style":"#districtes_barcelona {\n  polygon-fill:#FF6600;\n  polygon-opacity: 0.7;\n  line-opacity:1;\n  line-color: #FFFFFF;\n}"}'

describe 'Helpers' do
  describe 'ExploreAPI' do

    before(:each) do
      @explore_api = Helpers::ExploreAPI.new
    end

    it 'should return the visualization table' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(:map, :user_id => user.id)
      visualization = FactoryGirl.build(:table_visualization, :user_id => user.id, :map_id => map.id)
      layer_1 = create_layer('table_1', 'user_name_1', 1)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1])
      tables = @explore_api.get_visualization_tables(visualization)
      tables.should eq '{\"user_name_1\".table_1}'
    end

    it 'should return the visualizations tables with multiple layers' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(:map, :user_id => user.id)
      visualization = FactoryGirl.build(:derived_visualization, :user_id => user.id, :map_id => map.id)
      layer_1 = create_layer('table_1', 'user_name_1', 1)
      layer_2 = create_layer('table_2', 'user_name_2', 2)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1, layer_2])
      tables = @explore_api.get_visualization_tables(visualization)
      tables.should eq '{\"user_name_1\".table_1,\"user_name_2\".table_2}'
    end

    it 'should return the visualizations tables with multiple layers without duplicates' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(:map, :user_id => user.id)
      visualization = FactoryGirl.build(:derived_visualization, :user_id => user.id, :map_id => map.id)
      layer_1 = create_layer('table_1', 'user_name_1', 1)
      layer_2 = create_layer('table_1', 'user_name_1', 2)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1, layer_2])
      tables = @explore_api.get_visualization_tables(visualization)
      tables.should eq '{\"user_name_1\".table_1}'
    end

    it 'should empty if the is no user name or table name in the layer' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(:map, :user_id => user.id)
      visualization = FactoryGirl.build(:table_visualization, :user_id => user.id, :map_id => map.id)
      layer_1 = create_layer('table_1', '', 1)
      layer_2 = create_layer('', 'user_name_2', 1)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1, layer_2])
      tables = @explore_api.get_visualization_tables(visualization)
      tables.should eq '{}'
    end

    it 'should return the geometry data properly setted' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(
        :map, user_id: user.id, zoom: 3, center: [30, 0], view_bounds_ne: [85.0511, 179],
        view_bounds_sw: [-85.0511, -179]
      )
      visualization = FactoryGirl.build(:derived_visualization, :user_id => user.id, :map_id => map.id)
      visualization.stubs(:map).returns(map)
      geometry_data = @explore_api.get_geometry_data(visualization)
      expected_data = {
        :zoom=>3,
        :view_box_polygon=>%Q[ST_Transform(ST_Envelope('SRID=4326;POLYGON((-179.0 -85.0511, -179.0 85.0511, 179.0 85.0511, 179.0 -85.0511, -179.0 -85.0511))'::geometry), 3857)],
        :center_geometry=>"ST_GeomFromText('POINT(0 30)',3857)"
      }
      geometry_data.should eq expected_data
    end

    it 'should return empty if there is no map associated to the visualization' do
      user = FactoryGirl.build(:user)
      visualization = FactoryGirl.build(:derived_visualization, :user_id => user.id)
      visualization.stubs(:map).returns(nil)
      geometry_data = @explore_api.get_geometry_data(visualization)
      expected_data = {}
      geometry_data.should eq expected_data
    end

    it 'should return the table data properly setted for two vis of the same user' do
      user = FactoryGirl.build(:user, :database_name => 'cartodb_user_1', :database_host => '127.0.0.1')
      User.stubs(:find).with(id: user.id).returns(user)
      visualization = FactoryGirl.build(:table_visualization, :user_id => user.id)
      visualization_2 = FactoryGirl.build(:table_visualization, :user_id => user.id)
      result = [
        {"row_count" => 10, "size" => 100, "table_name" => visualization.name}, 
        {"row_count" => 20, "size" => 200, "table_name" => visualization_2.name}
      ]
      conn = Object.new
      conn.stubs(:close => true, :exec => result)
      PG::Connection.stubs(:open => conn)
      table = FactoryGirl.build(:table)
      table.stubs(:geometry_types => ["ST_Point"])
      user_table = FactoryGirl.build(:user_table)
      user_table.stubs(:service).returns(table)
      user_table.stubs(:first).returns(user_table)
      UserTable.stubs(:where => user_table)
      table_data = @explore_api.get_visualizations_table_data([visualization, visualization_2])
      expected_data = { 
        user.id => {
          visualization.name => {
            :rows=>10, :size=>100, :geometry_types=>["ST_Point"]
          },
          visualization_2.name => {
            :rows=>20, :size=>200, :geometry_types=>["ST_Point"]
          }
        }
      }
      table_data.should eq expected_data
    end

    it 'should return the table data properly setted for two vis of the different users' do
      user = FactoryGirl.build(:user, :database_name => 'cartodb_user_1', :database_host => '127.0.0.1')
      user_2 = FactoryGirl.build(:user, :database_name => 'cartodb_user_2', :database_host => '127.0.0.1')
      User.stubs(:find).with(id: user.id).returns(user)
      User.stubs(:find).with(id: user_2.id).returns(user_2)
      visualization = FactoryGirl.build(:table_visualization, :user_id => user.id)
      visualization_2 = FactoryGirl.build(:table_visualization, :user_id => user_2.id)
      result_1 = [{"row_count" => 10, "size" => 100, "table_name" => visualization.name}]
      result_2 = [{"row_count" => 20, "size" => 200, "table_name" => visualization_2.name}]
      conn = Object.new
      conn.stubs(:close => true, :exec => result_1)
      conn_2 = Object.new
      conn_2.stubs(:close => true, :exec => result_2)
      PG::Connection.stubs(:open).with(:dbname => user.database_name, :host => user.database_host, :user => 'postgres').returns(conn)
      PG::Connection.stubs(:open).with(:dbname => user_2.database_name, :host => user_2.database_host, :user => 'postgres').returns(conn_2)
      table = FactoryGirl.build(:table)
      table.stubs(:geometry_types => ["ST_Point"])
      user_table = FactoryGirl.build(:user_table)
      user_table.stubs(:service).returns(table)
      user_table.stubs(:first).returns(user_table)
      UserTable.stubs(:where => user_table)
      table_data = @explore_api.get_visualizations_table_data([visualization, visualization_2])
      expected_data = { 
        user.id => {
          visualization.name => {
            :rows=>10, :size=>100, :geometry_types=>["ST_Point"]
          }
        },
        user_2.id => {
          visualization_2.name => {
            :rows=>20, :size=>200, :geometry_types=>["ST_Point"]
          }
        }
      }
      table_data.should eq expected_data
    end

    it 'should return nil if the coordinates are out of the bounds' do
      user = FactoryGirl.build(:user)
      map = FactoryGirl.build(
        :map, user_id: user.id, zoom: 3, center: [45.706179285330855, 1439.12109375], view_bounds_ne: [-13.2399454992863, 1251.2109374999998],
        view_bounds_sw: [75.05035357407698, 1627.03125]
      )
      visualization = FactoryGirl.build(:derived_visualization, :user_id => user.id, :map_id => map.id)
      visualization.stubs(:map).returns(map)
      geometry_data = @explore_api.get_geometry_data(visualization)
      expected_data = {
        :zoom=>3,
        :view_box_polygon=> nil,
        :center_geometry=> nil
      }
      geometry_data.should eq expected_data
    end

  end

  def create_layer(table_name, user_name, order = 1)
    options = JSON.parse(CARTO_OPTIONS)
    options["table_name"] = table_name
    options["user_name"] = user_name
    FactoryGirl.build(:carto_layer, :options => options, :order => order)
  end

end
