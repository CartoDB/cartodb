# coding: UTF-8

require 'spec_helper'

describe "Assets API" do

  before(:all) do
    @user = create_user(username: 'test')
  end

  before(:each) do
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  let(:params) { { :api_key => @user.api_key } }

  describe 'POST /api/v1/geocodings' do
    it 'creates a new geocoding' do
      Geocoding.any_instance.stubs("run!").returns(true)
      table = create_table(user_id: @user.id)
      payload = params.merge(table_name: table.name, formatter:  'name, description')
      post_json v1_geocodings_url(payload) do |response|
        response.status.should eq 200
        response.body[:id].should_not be_nil
        response.body[:user_id].should eq @user.id
        response.body[:table_name].should eq table.name
        response.body[:formatter].should eq 'name, description'
        response.body[:created_at].should_not be_nil
        response.body[:updated_at].should_not be_nil
      end
    end

    it 'returns an error on bad payload' do
      payload = params.merge(table_name: '', formatter:  '')
      post_json v1_geocodings_url(payload) do |response|
        response.status.should eq 422
        response.body[:description].should eq "formatter is not present, table_name is not present"
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
      geocoding = FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user: @user)
      FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user_id: @user.id+1)

      get_json v1_geocoding_url(params.merge(id: geocoding.id)) do |response|
        response.status.should be_success
        response.body[:id].should eq geocoding.id
      end
    end
  end

  describe 'PUT /api/v1/geocodings/:id' do
    it 'cancels a geocoding job' do
      geocoding = FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).returns(true)

      put_json v1_geocoding_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should be_success
        geocoding.reload.state.should eq 'cancelled'
        response.body[:state].should eq 'cancelled' 
      end
    end

    it 'fails gracefully on job cancel failure' do
      geocoding = FactoryGirl.create(:geocoding, table_name: 'a', formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).raises('wadus')

      put_json v1_geocoding_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should eq 400
        response.body.should eq errors: "wadus"
      end
    end
  end
end
