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

  let(:params) { { :api_key => @user.api_key } }

  describe 'POST /api/v1/geocodings' do
    let(:table) { create_table(user_id: @user.id) }

    it 'creates a new geocoding' do
      Geocoding.any_instance.stubs("run!").returns(true)
      payload = params.merge table_name: table.name, formatter:  'name, description', kind: 'high-resolution'
      post_json v1_geocodings_url(payload) do |response|
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
      post_json v1_geocodings_url(payload) do |response|
        response.status.should eq 200
        response.body[:id].should_not be_nil
        response.body[:formatter].should eq 'name'
      end
    end

    it 'responds with 422 on bad payload' do
      payload = params.merge(table_name: '', formatter:  '', kind: 'high-resolution')
      post_json v1_geocodings_url(payload) do |response|
        response.status.should eq 422
        response.body[:description].should eq "formatter is not present, table_id is not present"
      end
    end

    it 'responds with 500 on failure' do
      payload = params.merge(table_name: '', formatter:  '', kind: 'high-resolution')
      Geocoding.any_instance.stubs(:save).raises(RuntimeError.new)
      post_json v1_geocodings_url(payload) do |response|
        response.status.should eq 500
        response.body[:description].should eq "RuntimeError"
      end
    end
  end

  describe 'GET /api/v1/geocodings' do
    it 'returns every geocoding belonging to current_user' do
      FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user: @user, state: 'wadus')
      FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user_id: @user.id+1)
      get_json v1_geocodings_url(params) do |response|
        response.status.should be_success
        response.body[:geocodings].size.should == 1
      end
    end
  end

  describe 'GET /api/v1/geocodings/:id' do
    it 'returns a geocoding' do
      geocoding = FactoryGirl.create(:geocoding, table_id: 1, formatter: 'b', user: @user)
      FactoryGirl.create(:geocoding, table_id: 2, formatter: 'b', user_id: @user.id+1)

      get_json v1_geocoding_url(params.merge(id: geocoding.id)) do |response|
        response.status.should be_success
        response.body[:id].should eq geocoding.id
      end
    end

    it 'does not return a geocoding owned by another user' do
      geocoding = FactoryGirl.create(:geocoding, table_id: 1, formatter: 'b', user_id: @user.id + 1)

      get_json v1_geocoding_url(params.merge(id: geocoding.id)) do |response|
        response.status.should eq 404
      end
    end
  end

  describe 'PUT /api/v1/geocodings/:id' do
    it 'cancels a geocoding job' do
      geocoding = FactoryGirl.create(:geocoding, table_id: 2, formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).returns(true)

      put_json v1_geocoding_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should be_success
        geocoding.reload.state.should eq 'cancelled'
        response.body[:state].should eq 'cancelled' 
      end
    end

    it 'fails gracefully on job cancel failure' do
      geocoding = FactoryGirl.create(:geocoding, table_id: 1, formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).raises('wadus')

      put_json v1_geocoding_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should eq 400
        response.body.should eq errors: "wadus"
      end
    end
  end

  describe 'GET /api/v1/geocodings/country_data_for/:country_code' do
    it 'returns the available services for that country code' do
      api_response = [{"service"=>"postal_codes", "iso3"=>"ESP"}]
      ::CartoDB::SQLApi.any_instance.stubs(:fetch).returns(api_response)
      expected_response = { admin0: ["polygon"], admin1: ["polygon"], namedplace: ["point"], postalcode: ["polygon"] }

      get_json country_data_v1_geocodings_url(params.merge(country_code: 'ESP')) do |response|
        response.status.should be_success
        response.body.should eq expected_response
      end
    end
  end


  describe 'GET /api/v1/geocodings/get_countries' do
    it 'returns the list of countries with geocoding data' do
      api_response = [{"iso3"=>"ESP"}]
      ::CartoDB::SQLApi.any_instance.stubs(:fetch).returns(api_response)

      get_json get_countries_v1_geocodings_url(params) do |response|
        response.status.should be_success
        response.body.should eq api_response
      end
    end
  end
end
