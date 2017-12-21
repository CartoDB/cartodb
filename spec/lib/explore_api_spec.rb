# encoding: UTF-8
require_relative '../spec_helper'
require_relative '../../lib/explore_api'
require_relative '../factories/visualization_creation_helpers'

describe 'ExploreAPI' do
  include_context 'visualization creation helpers'

  before(:each) do
    @explore_api = ExploreAPI.new
  end

  it 'should return the visualization table' do
    user = FactoryGirl.build(:carto_user)
    map = FactoryGirl.build(:carto_map, user_id: user.id)
    visualization = FactoryGirl.build(:carto_table_visualization, user_id: user.id, map: map)
    visualization.map.layers << create_layer('table_1', 'user_name_1', 1)
    tables = @explore_api.get_visualization_tables(visualization)
    tables.should eq '{\"user_name_1\".table_1}'
  end

  it 'should return the visualizations tables with multiple layers' do
    user = FactoryGirl.build(:carto_user)
    map = FactoryGirl.build(:carto_map, user_id: user.id)
    visualization = FactoryGirl.build(:carto_visualization, user_id: user.id, map: map)
    visualization.map.layers << create_layer('table_1', 'user_name_1', 1)
    visualization.map.layers << create_layer('table_2', 'user_name_2', 2)
    tables = @explore_api.get_visualization_tables(visualization)
    tables.should eq '{\"user_name_1\".table_1,\"user_name_2\".table_2}'
  end

  it 'should return the visualizations tables with multiple layers without duplicates' do
    user = FactoryGirl.build(:carto_user)
    map = FactoryGirl.build(:carto_map, user_id: user.id)
    visualization = FactoryGirl.build(:carto_visualization, user_id: user.id, map: map)
    visualization.map.layers << create_layer('table_1', 'user_name_1', 1)
    visualization.map.layers << create_layer('table_1', 'user_name_1', 2)
    tables = @explore_api.get_visualization_tables(visualization)
    tables.should eq '{\"user_name_1\".table_1}'
  end

  it 'should empty if the is no user name or table name in the layer' do
    user = FactoryGirl.build(:carto_user)
    map = FactoryGirl.build(:carto_map, user_id: user.id)
    visualization = FactoryGirl.build(:carto_table_visualization, user_id: user.id, map: map)
    visualization.map.layers << create_layer('table_1', '', 1)
    visualization.map.layers << create_layer('', 'user_name_2', 1)
    tables = @explore_api.get_visualization_tables(visualization)
    tables.should eq '{}'
  end

  it 'should return the geometry data properly setted' do
    user = FactoryGirl.build(:carto_user)
    map = FactoryGirl.build(:carto_map,
                            user_id: user.id,
                            zoom: 3,
                            center: '[30, 0]',
                            view_bounds_ne: '[85.0511, 179]',
                            view_bounds_sw: '[-85.0511, -179]'
                           )
    visualization = FactoryGirl.build(:carto_visualization, user_id: user.id, map: map)
    geometry_data = @explore_api.get_geometry_data(visualization)
    expected_data = {
      zoom: 3,
      view_box_polygon: "ST_Transform(ST_Envelope('SRID=4326;POLYGON((-179.0 -85.0511, -179.0 85.0511, " \
                        "179.0 85.0511, 179.0 -85.0511, -179.0 -85.0511))'::geometry), 3857)",
      center_geometry: "ST_GeomFromText('POINT(0 30)',3857)"
    }
    geometry_data.should eq expected_data
  end

  it 'should return empty if there is no map associated to the visualization' do
    user = FactoryGirl.build(:carto_user)
    visualization = FactoryGirl.build(:carto_visualization, user_id: user.id, map: nil)
    geometry_data = @explore_api.get_geometry_data(visualization)
    expected_data = {}
    geometry_data.should eq expected_data
  end

  it 'should return the table data properly setted for two vis of the same user' do
    user = FactoryGirl.build(:user, database_name: 'cartodb_user_1', database_host: '127.0.0.1')
    ::User.stubs(:find).with(id: user.id).returns(user)
    visualization = FactoryGirl.build(:table_visualization, user_id: user.id)
    visualization_2 = FactoryGirl.build(:table_visualization, user_id: user.id)
    result = [
      { "row_count" => 10, "size" => 100, "table_name" => visualization.name },
      { "row_count" => 20, "size" => 200, "table_name" => visualization_2.name }
    ]
    conn = Object.new
    conn.stubs(close: true, exec: result)
    PG::Connection.stubs(open: conn)
    table = FactoryGirl.build(:table)
    table.stubs(geometry_types: ["ST_Point"])
    user_table = FactoryGirl.build(:user_table)
    user_table.stubs(:service).returns(table)
    user_table.stubs(:first).returns(user_table)
    Carto::UserTable.stubs(where: user_table)
    table_data = @explore_api.get_visualizations_table_data([visualization, visualization_2])
    expected_data = {
      user.id => {
        visualization.name => {
          rows: 10, size: 100, geometry_types: ["ST_Point"]
        },
        visualization_2.name => {
          rows: 20, size: 200, geometry_types: ["ST_Point"]
        }
      }
    }
    table_data.should eq expected_data
  end

  it 'should return the table data properly setted for two vis of the different users' do
    user = FactoryGirl.build(:user, database_name: 'cartodb_user_1', database_host: '127.0.0.1')
    user_2 = FactoryGirl.build(:user, database_name: 'cartodb_user_2', database_host: '127.0.0.1')
    ::User.stubs(:find).with(id: user.id).returns(user)
    ::User.stubs(:find).with(id: user_2.id).returns(user_2)
    visualization = FactoryGirl.build(:table_visualization, user_id: user.id)
    visualization_2 = FactoryGirl.build(:table_visualization, user_id: user_2.id)
    result_1 = [{ "row_count" => 10, "size" => 100, "table_name" => visualization.name }]
    result_2 = [{ "row_count" => 20, "size" => 200, "table_name" => visualization_2.name }]
    conn = Object.new
    conn.stubs(close: true, exec: result_1)
    conn_2 = Object.new
    conn_2.stubs(close: true, exec: result_2)
    PG::Connection.stubs(:open).
      with(dbname: user.database_name, host: user.database_host, user: 'postgres').
      returns(conn)
    PG::Connection.stubs(:open).
      with(dbname: user_2.database_name, host: user_2.database_host, user: 'postgres').
      returns(conn_2)
    table = FactoryGirl.build(:table)
    table.stubs(geometry_types: ["ST_Point"])
    user_table = FactoryGirl.build(:user_table)
    user_table.stubs(:service).returns(table)
    user_table.stubs(:first).returns(user_table)
    Carto::UserTable.stubs(where: user_table)
    table_data = @explore_api.get_visualizations_table_data([visualization, visualization_2])
    expected_data = {
      user.id => {
        visualization.name => {
          rows: 10, size: 100, geometry_types: ["ST_Point"]
        }
      },
      user_2.id => {
        visualization_2.name => {
          rows: 20, size: 200, geometry_types: ["ST_Point"]
        }
      }
    }
    table_data.should eq expected_data
  end

  it 'should return nil if the coordinates are out of the bounds' do
    user = FactoryGirl.build(:user)
    map = FactoryGirl.build(
      :map,
      user_id: user.id,
      zoom: 3,
      center: [45.706179285330855, 1439.12109375],
      view_bounds_ne: [-13.2399454992863, 1251.2109374999998],
      view_bounds_sw: [75.05035357407698, 1627.03125]
    )
    visualization = FactoryGirl.build(:derived_visualization, user_id: user.id, map_id: map.id)
    visualization.stubs(:map).returns(map)
    geometry_data = @explore_api.get_geometry_data(visualization)
    expected_data = {
      zoom: 3,
      view_box_polygon: nil,
      center_geometry: nil
    }
    geometry_data.should eq expected_data
  end

  describe 'likes' do
    it 'should return 0 elements if dont have likes' do
      date = Date.today - 1.days
      user = FactoryGirl.build(:user)
      FactoryGirl.build(:derived_visualization, user_id: user.id)

      likes = @explore_api.visualization_likes_since(date)
      likes.length.should eq 0
    end

    it 'should return 10 likes the visualization' do
      date = Date.today - 1.days
      user = FactoryGirl.build(:user)
      visualization_1 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      like = { subject: visualization_1.id, count: 1 }
      like.stubs(:group_and_count).returns(like)
      like.stubs(:all).returns([like])
      CartoDB::Like.stubs(:where).with(regexp_matches(/created_at >=/), optionally(date)).returns(like)
      dataset = Object.new
      dataset.stubs(:count).returns(10)
      CartoDB::Like.stubs(:where).with(subject: visualization_1.id).returns(dataset)

      likes = @explore_api.visualization_likes_since(date)
      likes[visualization_1.id].should eq 10
    end
  end

  describe 'mapviews' do
    it 'should return 0 elements if not mapviews in the checked date' do
      date = Date.today - 1.days
      date_key = date.strftime("%Y%m%d")
      user = FactoryGirl.build(:user)
      visualization_1 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      add_total_data(visualization_1.id, user.username, 490)
      add_date_data(visualization_1.id, user.username, date_key, 0)

      mapviews = @explore_api.visualization_mapviews_since(Date.today - 1.days)
      mapviews.length.should eq 0
    end

    it 'should return 1 of 4 elements if not mapviews in the checked date' do
      date = Date.today - 1.days
      date_key = date.strftime("%Y%m%d")
      user = FactoryGirl.build(:user)
      visualization_1 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      add_total_data(visualization_1.id, user.username, 490)
      add_date_data(visualization_1.id, user.username, date_key, 1)
      visualization_2 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      add_total_data(visualization_2.id, user.username, 0)
      add_date_data(visualization_2.id, user.username, date_key, 0)
      visualization_3 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      add_total_data(visualization_3.id, user.username, 0)
      add_date_data(visualization_3.id, user.username, date_key, 0)
      visualization_4 = FactoryGirl.build(:derived_visualization, user_id: user.id)
      add_total_data(visualization_4.id, user.username, 490)
      add_date_data(visualization_4.id, user.username, (Date.today - 10.days).strftime("%Y%m%d"), 10)

      mapviews = @explore_api.visualization_mapviews_since(Date.today - 1.days)
      mapviews.length.should eq 1
      mapviews.has_key?(visualization_1.id).should eq true
      mapviews[visualization_1.id].should eq 491
    end
  end
end

def add_date_data(visualization_id, username, date, value)
  key = build_key(username, visualization_id)
  $users_metadata.ZADD(key, value, date).to_i
  updated_total = $users_metadata.ZSCORE(key, "total").to_f + value.to_f
  $users_metadata.ZADD(key, updated_total, "total").to_i
end

def add_total_data(visualization_id, username, value)
  key = build_key(username, visualization_id)
  $users_metadata.ZADD(key, value, "total").to_i
end

def build_key(username, visualization_id)
  api_calls = CartoDB::Stats::APICalls.new
  api_calls.redis_api_call_key(username, "mapviews", visualization_id)
end
