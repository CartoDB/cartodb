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

  let(:params) { { :api_key => @user.get_map_key } }

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

end
