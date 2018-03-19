# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../api/json/geocodings_controller_shared_examples'
require_relative '../../../../app/controllers/carto/api/geocodings_controller'
require 'mock_redis'

describe Carto::Api::GeocodingsController do
  it_behaves_like 'geocoding controllers' do
  end

describe 'legacy behaviour tests' do
    let(:params) { { :api_key => @user.api_key } }

    before(:all) do
      @user = create_user
    end

    before(:each) do
      bypass_named_maps
      delete_user_data @user
      host! "#{@user.username}.localhost.lan"
      login_as(@user, scope: @user.username)
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    describe 'GET /api/v1/geocodings' do

      it 'returns every geocoding belonging to current_user' do
        FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user: @user, state: 'wadus')
        FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user_id: UUIDTools::UUID.timestamp_create.to_s)
        get_json api_v1_geocodings_index_url(params) do |response|
          response.status.should be_success
          response.body[:geocodings].size.should == 1
        end
      end
    end

    describe 'GET /api/v1/geocodings/:id' do

      it 'returns a geocoding' do
        @user.geocoder_provider = 'heremaps'
        @user.save.reload
        redis_mock = MockRedis.new
        user_geocoder_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, _orgname = nil, _redis = redis_mock)
        CartoDB::GeocoderUsageMetrics.stubs(:new).returns(user_geocoder_metrics)
        user_geocoder_metrics.incr(:geocoder_here, :success_responses, 100)
        geocoding = FactoryGirl.create(:geocoding, table_id: UUIDTools::UUID.timestamp_create.to_s, formatter: 'b', user: @user, used_credits: 100, processed_rows: 100, kind: 'high-resolution')

        get_json api_v1_geocodings_show_url(params.merge(id: geocoding.id)) do |response|
          response.status.should be_success
          response.body[:id].should eq geocoding.id
          response.body[:used_credits].should eq 100
          response.body[:price].should eq 150
          response.body[:remaining_quota].should eq 900
        end
      end

      it 'does not return a geocoding owned by another user' do
        geocoding = FactoryGirl.create(:geocoding, table_id: UUIDTools::UUID.timestamp_create.to_s, formatter: 'b', user_id: UUIDTools::UUID.timestamp_create.to_s)

        get_json api_v1_geocodings_show_url(params.merge(id: geocoding.id)) do |response|
          response.status.should eq 404
        end
      end
    end

    describe 'GET /api/v1/geocodings/estimation_for' do

      it 'returns the estimated geocoding cost for the specified table' do
        table = create_table(user_id: @user.id)
        Geocoding.stubs(:processable_rows).returns(2)
        Carto::Geocoding.stubs(:processable_rows).returns(2)
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name)) do |response|
          response.status.should be_success
          response.body.should == {:rows=>2, :estimation=>0}
        end
        Geocoding.stubs(:processable_rows).returns(1400)
        Carto::Geocoding.stubs(:processable_rows).returns(1400)
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name)) do |response|
          response.status.should be_success
          response.body.should == {:rows=>1400, :estimation=>600}
        end
        Geocoding.stubs(:processable_rows).returns(1001)
        Carto::Geocoding.stubs(:processable_rows).returns(1001)
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name)) do |response|
          response.status.should be_success
          response.body.should == {:rows=>1001, :estimation=>1.5}
        end
      end

      it 'returns 500 if the table does not exist' do
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: 'me_not_exist')) do |response|
          response.status.should eq 500
          response.body[:description].should_not be_blank
        end
      end

      it 'takes the parameter force_all_rows into consideration' do
        @user.geocoding_quota = 0
        @user.save
        table = create_table(user_id: @user.id)
        table.add_column!(name: 'cartodb_georef_status', type: 'bool')
        table.insert_row!(cartodb_georef_status: nil)
        table.insert_row!(cartodb_georef_status: true)
        table.insert_row!(cartodb_georef_status: false)

        expected_rows = 2
        expected_estimation = expected_rows * @user.geocoding_block_price / ::User::GEOCODING_BLOCK_SIZE.to_f
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name, force_all_rows: false)) do |response|
          response.status.should be_success
          response.body.should == {rows: expected_rows, estimation: expected_estimation}
        end

        expected_rows = 3
        expected_estimation = expected_rows * @user.geocoding_block_price / ::User::GEOCODING_BLOCK_SIZE.to_f
        get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name, force_all_rows: true)) do |response|
          response.status.should be_success
          response.body.should == {rows: expected_rows, estimation: expected_estimation}
        end

      end

    end
  end


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

    it 'returns point from an input column if SQLApi says there is a point service for it' do
      table = create_table(user_id: @user1.id)
      table.add_column!(name: 'country', type: 'string')
      table.insert_row!(country: 'Cote d\'Ivore')

      CartoDB::SQLApi.any_instance.expects(:fetch).
        with("SELECT (admin0_available_services(Array['Cote d''Ivore'])).*").
        returns([{ 'postal_code_points' => 1, 'postal_code_polygons' => 0 }])
      get api_v1_geocodings_available_geometries_url,
        { kind: 'postalcode', column_name: 'country', table_name: table.name }
      last_response.status.should == 200
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

  describe 'estimation_for' do
    include_context 'users helper'
    include_context 'visualization creation helpers'

    before(:each) do
      login(@user1)
    end

    it 'returns estimation and price' do
      table = create_random_table(@user1)
      table.insert_row!({name: 'estimation'})

      get api_v1_geocodings_estimation_url(table_name: table.name)
      last_response.status.should eq 200
      body = JSON.parse(last_response.body)
      body.should == { 'rows' => 1, 'estimation' => 0 }
    end

  end

  def remove_dates(geocoding_hash)
    geocoding_hash.except('created_at', 'updated_at')
  end

  describe 'index' do
    include_context 'users helper'

    before(:each) do
      login(@user1)
    end

    it 'returns started geocodings but not finished' do
      geocoding1 = FactoryGirl.create(:geocoding, user: @user1, kind: 'high-resolution', created_at: Time.now,
                                      processed_rows: 1, state: 'started', formatter: 'foo')
      FactoryGirl.create(:geocoding, user: @user1, kind: 'high-resolution', created_at: Time.now,
                         processed_rows: 1, state: 'finished', formatter: 'foo')

      get api_v1_geocodings_index_url
      last_response.status.should eq 200

      expected = {"geocodings"=>[{"table_name" => nil, "processed_rows" => 1, "remote_id" => nil, "formatter" => 'foo',
                                  "geocoder_type" => nil, "state" => "started", "cache_hits" => 0,
                                  "id" => geocoding1.id, "user_id" => @user1.id,"table_id" => nil,
                                  "automatic_geocoding_id" => nil, "kind" => "high-resolution", "country_code" => nil,
                                  "geometry_type" => nil, "processable_rows" => nil, "real_rows" => nil,
                                  "used_credits" => nil, "country_column" => nil, "data_import_id" => nil,
                                  "region_code" => nil, "region_column" => nil, "batched" => nil, "error_code" => nil,
                                  "force_all_rows" => false, "log_id" => nil, "pid" => nil}]}
      received_without_dates = {
        'geocodings' => JSON.parse(last_response.body)['geocodings'].map { |g| remove_dates(g) }
      }
      received_without_dates.should == expected
    end

  end

  describe 'show' do
    include_context 'users helper'

    before(:each) do
      login(@user1)
    end

    it 'returns requested geocoding' do
      geocoding = FactoryGirl.create(
        :geocoding,
        user: @user1,
        kind: 'high-resolution',
        created_at: Time.now,
        processed_rows: 1,
        state: 'started',
        formatter: 'foo'
      )

      get api_v1_geocodings_show_url(id: geocoding.id)
      last_response.status.should eq 200

      expected = {"id" => geocoding.id, "table_id" => nil, "table_name" => nil, "state" => "started",
                  "kind" => "high-resolution", "country_code" => nil, "region_code" => nil, "formatter" => 'foo',
                  "geocoder_type" => nil, "geometry_type" => nil, "error" => {"title" => "Geocoding error",
                  "description" => ""}, "processed_rows" => 1, "cache_hits" => 0, "processable_rows" => nil,
                  "real_rows" => nil, "price" => 0, "used_credits" => nil, "remaining_quota" => 0,
                  "country_column" => nil, "region_column" => nil, "data_import_id" => nil, "error_code" => nil}
      received_without_dates = remove_dates(JSON.parse(last_response.body))
      received_without_dates.should == expected
    end

  end

  include Rack::Test::Methods
  include Warden::Test::Helpers
end
