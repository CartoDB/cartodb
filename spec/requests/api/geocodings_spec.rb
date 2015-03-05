# coding: UTF-8

require 'spec_helper'

describe "Geocodings API" do

  before(:all) do
    @user = create_user(username: 'test')
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
  end

  let(:params) { { :api_key => @user.api_key } }

  describe 'POST /api/v1/geocodings' do
    let(:table) { create_table(user_id: @user.id) }

    it 'creates a new geocoding' do
      Geocoding.any_instance.stubs("run!").returns(true)
      payload = params.merge table_name: table.name, formatter:  'name, description', kind: 'high-resolution'
      post_json api_v1_geocodings_create_url(payload) do |response|
        response.status.should eq 200
        response.body[:id].should_not be_nil
        response.body[:user_id].should eq @user.id
        response.body[:table_id].should eq table.id
        response.body[:formatter].should eq 'name, description'
        response.body[:created_at].should_not be_nil
        response.body[:updated_at].should_not be_nil
      end
    end

    it 'uses column_name instead of formatter if present' do
      Geocoding.any_instance.stubs("run!").returns(true)
      payload = params.merge table_name: table.name, column_name:  'name', kind: 'high-resolution'
      post_json api_v1_geocodings_create_url(payload) do |response|
        response.status.should eq 200
        response.body[:id].should_not be_nil
        response.body[:formatter].should eq '{name}'
      end
    end

    it 'responds with 422 on bad payload' do
      payload = params.merge(table_name: '', formatter:  '', kind: 'high-resolution')
      post_json api_v1_geocodings_create_url(payload) do |response|
        response.status.should eq 422
        response.body[:description].should eq "formatter is not present"
      end
    end

    it 'responds with 500 on failure' do
      payload = params.merge(table_name: '', formatter:  '', kind: 'high-resolution')
      Geocoding.any_instance.stubs(:save).raises(RuntimeError.new)
      post_json api_v1_geocodings_create_url(payload) do |response|
        response.status.should eq 500
        response.body[:description].should eq "RuntimeError"
      end
    end
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

  describe 'PUT /api/v1/geocodings/:id' do
    it 'cancels a geocoding job' do
      geocoding = FactoryGirl.create(:geocoding, table_id: UUIDTools::UUID.timestamp_create.to_s, formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).returns(true)

      put_json api_v1_geocodings_update_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should be_success
        geocoding.reload.state.should eq 'cancelled'
        response.body[:state].should eq 'cancelled' 
      end
    end

    it 'fails gracefully on job cancel failure' do
      geocoding = FactoryGirl.create(:geocoding, table_id: UUIDTools::UUID.timestamp_create.to_s, formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).raises('wadus')

      put_json api_v1_geocodings_update_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should eq 400
        response.body.should eq errors: "wadus"
      end
    end
  end

  describe 'GET /api/v1/geocodings/country_data_for/:country_code' do
    it 'returns the available services for that country code' do
      api_response = [{"service"=>"point"}, {"service"=>"polygon"}]
      ::CartoDB::SQLApi.any_instance.stubs(:fetch).returns(api_response)
      expected_response = { admin1: ["polygon"], namedplace: ["point"], postalcode: ["point", "polygon"] }

      get_json api_v1_geocodings_country_data_url(params.merge(country_code: 'ESP')) do |response|
        response.status.should be_success
        response.body.should eq expected_response
      end
    end
  end


  describe 'GET /api/v1/geocodings/get_countries' do
    it 'returns the list of countries with geocoding data' do
      api_response = [{"iso3"=>"ESP"}]
      ::CartoDB::SQLApi.any_instance.stubs(:fetch).returns(api_response)

      get_json api_v1_geocodings_get_countries_url(params) do |response|
        response.status.should be_success
        response.body.should eq api_response
      end
    end
  end


  describe 'GET /api/v1/geocodings/estimation_for' do
    let(:table) { create_table(user_id: @user.id) }

    it 'returns the estimated geocoding cost for the specified table' do
      Geocoding.stubs(:processable_rows).returns(2)
      get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name)) do |response|
        response.status.should be_success
        response.body.should == {:rows=>2, :estimation=>0}
      end
      Geocoding.stubs(:processable_rows).returns(1400)
      get_json api_v1_geocodings_estimation_url(params.merge(table_name: table.name)) do |response|
        response.status.should be_success
        response.body.should == {:rows=>1400, :estimation=>600}
      end
      Geocoding.stubs(:processable_rows).returns(1001)
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

  end

end
