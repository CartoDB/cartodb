# coding: UTF-8

require 'spec_helper'

describe "Geocodings API" do
  before(:all) do
    @user = FactoryGirl.create(:valid_user, table_quota: 50)

    delete_user_data @user
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    stub_named_maps_calls
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

    describe 'namedplace geocodings' do
      it "should set the country_code when the name of the country is present" do
        Geocoding.any_instance.stubs("run!").returns(true)
        payload = params.merge \
          table_name: table.name,
          column_name:  'name',
          text: true,
          location: 'spain',
          kind: 'namedplace'
        post_json api_v1_geocodings_create_url(payload) do |response|
          response.status.should eq 200
          response.body[:id].should_not be_nil
          response.body[:country_code].should eq "'spain'"
          response.body[:country_column].should be_nil
        end
      end

      it "should set country_code and country_column when a country column has been selected" do
        table.add_column!(name: "country", type: "text")
        table.insert_row!(country: "spain")
        table.insert_row!(country: "spain")
        table.insert_row!(country: "us")
        table.reload

        Geocoding.any_instance.stubs("run!").returns(true)
        payload = params.merge \
          table_name: table.name,
          column_name:  'name',
          text: false,
          location: 'country',
          kind: 'namedplace'
        post_json api_v1_geocodings_create_url, payload do |response|
          response.status.should eq 200
          response.body[:id].should_not be_nil
          response.body[:country_code].should eq "'spain','us'"
          response.body[:country_column].should eq "country"
        end
      end

      it "should set the region_code when the name of the region is present" do
        Geocoding.any_instance.stubs("run!").returns(true)
        payload = params.merge \
          table_name: table.name,
          column_name:  'name',
          text: true,
          location: 'spain',
          region_text: true,
          region: 'madrid',
          kind: 'namedplace'
        post_json api_v1_geocodings_create_url(payload) do |response|
          response.status.should eq 200
          response.body[:id].should_not be_nil
          response.body[:region_code].should eq "'madrid'"
          response.body[:region_column].should be_nil
        end
      end

      it "should set region_code and region_column when a region column has been selected" do
        table.add_column!(name: "country", type: "text")
        table.add_column!(name: "region", type: "text")
        table.insert_row!(country: "spain", region: "madrid")
        table.insert_row!(country: "spain", region: "madrid")
        table.insert_row!(country: "us", region: "minnesota")
        table.reload

        Geocoding.any_instance.stubs("run!").returns(true)
        payload = params.merge \
          table_name: table.name,
          column_name:  'name',
          text: false,
          location: 'country',
          region_text: false,
          region: 'region',

          kind: 'namedplace'
        post_json api_v1_geocodings_create_url, payload do |response|
          response.status.should eq 200
          response.body[:id].should_not be_nil
          response.body[:region_code].should eq "'madrid','minnesota'"
          response.body[:region_column].should eq "region"
        end
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

  describe 'PUT /api/v1/geocodings/:id' do
    it 'fails gracefully on job cancel failure' do
      geocoding = FactoryGirl.create(:geocoding, table_id: UUIDTools::UUID.timestamp_create.to_s, formatter: 'b', user: @user)
      Geocoding.any_instance.stubs(:cancel).raises('wadus')

      put_json api_v1_geocodings_update_url(params.merge(id: geocoding.id)), { state: 'cancelled' } do |response|
        response.status.should eq 400
        response.body.should eq errors: "wadus"
      end
    end
  end

end
