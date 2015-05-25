# encoding: utf-8

shared_examples_for "geocoding controllers" do
  include CacheHelper

  describe 'available_geometries' do
    include_context 'users helper'
    include_context 'visualization creation helpers'

    before(:each) do
      login(@user1)
    end

    it 'returns 400 if kind is not admin1, namedplace or postalcode' do
      get api_v1_geocodings_available_geometries_url, { kind: 'kk'}
      last_response.status.should == 400
    end

    it 'returns "polygon" for "admin1" kind' do
      get api_v1_geocodings_available_geometries_url, { kind: 'admin1'}
      last_response.status.should == 200
      JSON.parse(last_response.body).should eq ['polygon']
    end

    it 'returns "point" for "namedplace" kind' do
      get api_v1_geocodings_available_geometries_url, { kind: 'namedplace'}
      last_response.status.should == 200
      JSON.parse(last_response.body).should eq ['point']
    end

    it 'returns 400 for postal code if "free_text" or "column_name" and "table_name" are not set' do
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode'}
      last_response.status.should == 400
    end

    it 'returns empty json for postalcode if free text is empty or has non alphanumeric characters' do
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: ''}
      last_response.status.should == 200
      JSON.parse(last_response.body).should eq []

      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: ' '}
      last_response.status.should == 200
      JSON.parse(last_response.body).should eq []

      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: '--%'}
      last_response.status.should == 200
      JSON.parse(last_response.body).should eq []
    end

    it 'returns point and polygon if SQLApi says there are the same amount of points and polygons services, or the one with more data if they are not equal' do
      # INFO: this expectation is bound to implementation because it's used in a refactor
      CartoDB::SQLApi.any_instance.expects(:fetch).with("SELECT (admin0_available_services(Array['myfreetext'])).*").returns([ { 'postal_code_points' => 1, 'postal_code_polygons' => 1 }])
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: 'my free text'}
      JSON.parse(last_response.body).should eq ['point', 'polygon']

      CartoDB::SQLApi.any_instance.stubs(:fetch).returns([ { 'postal_code_points' => 1, 'postal_code_polygons' => 1 }, { 'postal_code_points' => 1 }])
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: 'my free text'}
      JSON.parse(last_response.body).should eq ['point']

      CartoDB::SQLApi.any_instance.stubs(:fetch).returns([ { 'postal_code_points' => 1, 'postal_code_polygons' => 1 }, { 'postal_code_polygons' => 1 }])
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', free_text: 'my free text'}
      JSON.parse(last_response.body).should eq ['polygon']
    end

    it 'returns 400 if table name does not exist' do
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', column_name: 'my_column', table_name: 'my_table'}
      last_response.status.should eq 400
    end

    it 'Queries SQL API with table columns' do
      cp = 12345
      table = create_random_table(@user1)
      table.insert_row!({name: cp})

      # INFO: this expectation is bound to implementation because it's used in a refactor
      CartoDB::SQLApi.any_instance.expects(:fetch).with("SELECT (admin0_available_services(Array['#{cp}'])).*").returns([ { 'postal_code_points' => 1, 'postal_code_polygons' => 1 }, { 'postal_code_polygons' => 1 }])
      get api_v1_geocodings_available_geometries_url, { kind: 'postalcode', column_name: 'name', table_name: table.name}
    end

  end

end
