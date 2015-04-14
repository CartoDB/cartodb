# encoding: utf-8
require_relative '../../spec_helper'

def app
  CartoDB::Application.new
end #app

describe Api::Json::RecordsController do
  include Rack::Test::Methods

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex'
    )
    @api_key = @user.api_key
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    delete_user_data @user
    @table = create_table :user_id => @user.id
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
    }
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
  end

  it "Insert a new row and get the record" do
    base_url  = "/api/v1/tables/#{@table.name}"
    payload   = {
      'name' => "Name 123",
      'description' => "The description"
    }

    post "#{base_url}/records?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    response = JSON.parse(last_response.body)  
    response['cartodb_id'].should == 1

    get "#{base_url}/records/1?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 200
    response = JSON.parse(last_response.body)  
    response['cartodb_id'].should == 1
    response['name'].should == "Name 123"
    response['description'].should == "The description"
  end

  it "Get a record that doesn't exist" do
    base_url  = "/api/v1/tables/#{@table.name}"
    get "#{base_url}/records/1?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 404
  end

  it "Update a row" do
    pk = @table.insert_row!(
      name: String.random(10),
      description: String.random(50),
      the_geom: %Q{\{"type":"Point","coordinates":[0.966797,55.91843]\}}
    )

    payload = {
      name:         "Name updated",
      description:  "Description updated",
      the_geom:     "{\"type\":\"Point\",\"coordinates\":[-3.010254,55.973798]}"
    }

    base_url  = "/api/v1/tables/#{@table.name}"
    put "#{base_url}/records/#{pk}?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    response = JSON.parse(last_response.body)
    response['description'].should == "Description updated"
    response['name'].should        == "Name updated"
    response['the_geom'].should    == "{\"type\":\"Point\",\"coordinates\":[-3.010254,55.973798]}"
  end

  it "Update a row that doesn't exist" do
    base_url  = "/api/v1/tables/#{@table.name}"
    payload = {
      name:        "Name updated",
      description: "Description updated"
    }
    put "#{base_url}/records/1?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 404
  end

  it "Remove a row" do
    pk = @table.insert_row!(
      name: String.random(10),
      description: String.random(50),
      the_geom: %Q{\{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}}
    )

    base_url  = "/api/v1/tables/#{@table.name}"
    delete "#{base_url}/records/#{pk}?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 204
    @table.rows_counted.should == 0
  end

  it "Remove multiple rows" do
    the_geom = %Q{
      \{"type":"Point","coordinates":[#{Float.random_longitude},#{Float.random_latitude}]\}
    }
    pk  = @table.insert_row!(
      name:         String.random(10),
      description:  String.random(50),
      the_geom:     the_geom
    )

    pk1  = @table.insert_row!(
      name:         String.random(10),
      description:  String.random(50),
      the_geom:     the_geom
    )

    pk2  = @table.insert_row!(
      name:         String.random(10),
      description:  String.random(50),
      the_geom:     the_geom
    )

    pk3  = @table.insert_row!(
      name:         String.random(10),
      description:  String.random(50),
      the_geom:     the_geom
    )

    base_url  = "/api/v1/tables/#{@table.name}"
    delete "#{base_url}/records/#{pk1}?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 204

    delete "#{base_url}/records/#{pk2}?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 204

    delete "#{base_url}/records/#{pk3}?api_key=#{@api_key}", {}, @headers
    last_response.status.should == 204
    @table.rows_counted.should == 1
  end
  
  it 'Create a new row of type number and insert float values' do
    base_url  = '/api/v1/tables'
    payload   = {
      name:   'My new imported table',
      schema: 'name varchar, age integer'
    }

    post "#{base_url}?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    name = JSON.parse(last_response.body).fetch('name')

    base_url    = "/api/v1/tables/#{name}"

    payload = { name: 'Fernando Blat', age: '29' }
    post "#{base_url}/records?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200

    payload = { name: 'Beatriz', age: '30.2' }
    post "#{base_url}/records?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200

    row_id = JSON.parse(last_response.body).fetch('cartodb_id')

    get "#{base_url}/columns?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    JSON.parse(last_response.body).should include(%w{age number})
    
    get "#{base_url}/records/#{row_id}?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    JSON.parse(last_response.body).fetch('age').should == 30.2
  end

  it "Create a new row including the_geom field" do
    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = nil
    
    base_url  = "/api/v1/tables/#{@table.name}"
    payload = {
      name:         "Fernando Blat",
      description:  "Geolocated programmer",
      the_geom:     %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    }
    post "#{base_url}/records?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    pk = JSON.parse(last_response.body).fetch('cartodb_id')
  end

  it "Update a row including the_geom field" do    
    lat = Float.random_latitude
    lon = Float.random_longitude
    pk = nil
    
    base_url  = "/api/v1/tables/#{@table.name}"
    payload = {
      name:         "Fernando Blat",
      description:  "Geolocated programmer",
      the_geom:     %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}}
    }

    post "#{base_url}/records?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
    pk = JSON.parse(last_response.body).fetch('cartodb_id')

    payload = { the_geom: %Q{\{"type":"Point","coordinates":[#{lon},#{lat}]\}} }
    put "#{base_url}/records/#{pk}?api_key=#{@api_key}", payload.to_json, @headers
    last_response.status.should == 200
  end

end
