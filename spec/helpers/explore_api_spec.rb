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

    it 'should return the visualization insertion values in order with the table columns' do
      user_options = {
        id: 'dcb16d4e-e74a-4764-b509-1b5f682238b5',
        username: 'user_test',
        twitter_username: 'twitter_user_test',
        website: 'website_test',
        avatar_url: 'avatar_url_test',
        available_for_hire: true
      }
      user = FactoryGirl.build(:user, user_options)
      map = FactoryGirl.build(
        :map, user_id: user.id, zoom: 3, center: [30, 0], view_bounds_ne: [90, 180],
        view_bounds_sw: [-90, -180]
      )
      visualization_options = {
        :id => 'ffb16d4e-e74a-4764-b509-1b5f682238b5',
        :user_id => user.id,
        :map_id => map.id,
        :name => 'vis_name',
        :description => 'vis_description',
        :created_at => '2015-08-13 06:13:15+00',
        :updated_at => '2015-09-03 06:12:15+00',
        :title => 'vis_title',
        :tags => ['lala', 'lele']
      }
      visualization = FactoryGirl.build(:derived_visualization, visualization_options)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:user).returns(user)
      visualization.stubs(:synchronization).returns(Object.new)
      visualization.stubs(:likes_count).returns(1)
      visualization.stubs(:map_views).returns(10)
      layer_1 = create_layer('table_1', 'user_name_1', 1)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1])
      bbox_values = {visualization.id => '0103000000010000000500000069B6E1BBD0FD69C17200D8285370474169B6E1BBD0FD69C1E6DDC1415E6B574120FFD8C8C1365FC1E6DDC1415E6B574120FFD8C8C1365FC17200D8285370474169B6E1BBD0FD69C17200D82853704741'}
      insert_values = @explore_api.get_visualizations_values_for_insert([visualization],bbox_values)
      insert_values[0].should eq "('ffb16d4e-e74a-4764-b509-1b5f682238b5','vis_name','vis_description','derived','false','{\\\"user_name_1\\\".table_1}','{lala,lele}',ST_AsText('0103000000010000000500000069B6E1BBD0FD69C17200D8285370474169B6E1BBD0FD69C1E6DDC1415E6B574120FFD8C8C1365FC1E6DDC1415E6B574120FFD8C8C1365FC17200D8285370474169B6E1BBD0FD69C17200D82853704741'),ST_Transform(ST_Envelope('SRID=4326;POLYGON((-180.0 -90.0, -180.0 90.0, 180.0 90.0, 180.0 -90.0, -180.0 -90.0))'::geometry), 3857),ST_GeomFromText('POINT(0 30)',3857),3,'2015-08-13 06:13:15 +0000','2015-09-03 06:12:15 +0000','','vis_title',1,0,'dcb16d4e-e74a-4764-b509-1b5f682238b5','user_test',NULL,'twitter_user_test','website_test','avatar_url_test','true')"
    end

    it 'should return the visualization insertion values in order with the table columns without geomery data' do
      user_options = {
        id: 'dcb16d4e-e74a-4764-b509-1b5f682238b5',
        username: 'user_test',
        twitter_username: 'twitter_user_test',
        website: 'website_test',
        avatar_url: 'avatar_url_test',
        available_for_hire: true
      }
      user = FactoryGirl.build(:user, user_options)
      visualization_options = {
        :id => 'ffb16d4e-e74a-4764-b509-1b5f682238b5',
        :user_id => user.id,
        :name => 'vis_name',
        :description => 'vis_description',
        :created_at => '2015-08-13 06:13:15+00',
        :updated_at => '2015-09-03 06:12:15+00',
        :title => 'vis_title',
        :tags => ['lala', 'lele']
      }
      visualization = FactoryGirl.build(:derived_visualization, visualization_options)
      visualization.stubs(:user).returns(user)
      visualization.stubs(:synchronization).returns(Hash.new)
      visualization.stubs(:likes_count).returns(1)
      visualization.stubs(:map_views).returns(10)
      insert_values = @explore_api.get_visualizations_values_for_insert([visualization],{})
      insert_values[0].should eq "('ffb16d4e-e74a-4764-b509-1b5f682238b5','vis_name','vis_description','derived','false','{}','{lala,lele}',NULL,NULL,NULL,NULL,'2015-08-13 06:13:15 +0000','2015-09-03 06:12:15 +0000','','vis_title',1,0,'dcb16d4e-e74a-4764-b509-1b5f682238b5','user_test',NULL,'twitter_user_test','website_test','avatar_url_test','true')"
    end

    it 'should have NULL values for geomtries out of bounds' do
      user_options = {
        id: 'dcb16d4e-e74a-4764-b509-1b5f682238b5',
        username: 'user_test',
        twitter_username: 'twitter_user_test',
        website: 'website_test',
        avatar_url: 'avatar_url_test',
        available_for_hire: true
      }
      user = FactoryGirl.build(:user, user_options)
      map = FactoryGirl.build(
        :map, user_id: user.id, zoom: 3, center: [45.706179285330855, 1439.12109375], view_bounds_ne: [-13.2399454992863, 1251.2109374999998],
        view_bounds_sw: [75.05035357407698, 1627.03125]
      )
      visualization_options = {
        :id => 'ffb16d4e-e74a-4764-b509-1b5f682238b5',
        :user_id => user.id,
        :map_id => map.id,
        :name => 'vis_name',
        :description => 'vis_description',
        :created_at => '2015-08-13 06:13:15+00',
        :updated_at => '2015-09-03 06:12:15+00',
        :title => 'vis_title',
        :tags => ['lala', 'lele']
      }
      visualization = FactoryGirl.build(:derived_visualization, visualization_options)
      visualization.stubs(:map).returns(map)
      visualization.stubs(:user).returns(user)
      visualization.stubs(:synchronization).returns(Object.new)
      visualization.stubs(:likes_count).returns(1)
      visualization.stubs(:map_views).returns(10)
      layer_1 = create_layer('table_1', 'user_name_1', 1)
      visualization.stubs(:layers).with(:carto_and_torque).returns([layer_1])
      bbox_values = {visualization.id => '0103000000010000000500000069B6E1BBD0FD69C17200D8285370474169B6E1BBD0FD69C1E6DDC1415E6B574120FFD8C8C1365FC1E6DDC1415E6B574120FFD8C8C1365FC17200D8285370474169B6E1BBD0FD69C17200D82853704741'}
      insert_values = @explore_api.get_visualizations_values_for_insert([visualization],bbox_values)
      insert_values[0].should eq "('ffb16d4e-e74a-4764-b509-1b5f682238b5','vis_name','vis_description','derived','false','{\\\"user_name_1\\\".table_1}','{lala,lele}',ST_AsText('0103000000010000000500000069B6E1BBD0FD69C17200D8285370474169B6E1BBD0FD69C1E6DDC1415E6B574120FFD8C8C1365FC1E6DDC1415E6B574120FFD8C8C1365FC17200D8285370474169B6E1BBD0FD69C17200D82853704741'),NULL,NULL,3,'2015-08-13 06:13:15 +0000','2015-09-03 06:12:15 +0000','','vis_title',1,0,'dcb16d4e-e74a-4764-b509-1b5f682238b5','user_test',NULL,'twitter_user_test','website_test','avatar_url_test','true')"
    end

  end

  def create_layer(table_name, user_name, order = 1)
    options = JSON.parse(CARTO_OPTIONS)
    options["table_name"] = table_name
    options["user_name"] = user_name
    FactoryGirl.build(:carto_layer, :options => options, :order => order)
  end

end
