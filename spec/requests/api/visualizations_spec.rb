require 'spec_helper_unit'
require_relative '../../../services/data-repository/backend/sequel'

def factory(attributes = {})
  {
    name: attributes.fetch(:name, Faker::Lorem.unique.word),
    tags: attributes.fetch(:tags, ['foo', 'bar']),
    map_id: attributes.fetch(:map_id, ::Map.create(user_id: @user.id).id),
    description: attributes.fetch(:description, 'bogus'),
    type: attributes.fetch(:type, 'derived'),
    privacy: attributes.fetch(:privacy, 'public'),
    source_visualization_id: attributes.fetch(:source_visualization_id, nil),
    parent_id: attributes.fetch(:parent_id, nil),
    locked: attributes.fetch(:locked, false),
    prev_id: attributes.fetch(:prev_id, nil),
    next_id: attributes.fetch(:next_id, nil)
  }
end

def table_factory(options = {})
  headers = { 'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json' }
  privacy = options.fetch(:privacy, 1)

  name = Faker::Lorem.unique.word
  payload = { name: name, description: "#{name} description" }

  post "/api/v1/tables?api_key=#{@api_key}", payload.to_json, headers

  table_attributes = JSON.parse(response.body)
  table_id = table_attributes.fetch('table_visualization').fetch('id')

  put "/api/v1/viz/#{table_id}?api_key=#{@api_key}", { privacy: privacy }.to_json, headers

  table_attributes
end

describe Carto::Api::VisualizationsController do
  include DataRepository

  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'HTTP_ACCEPT' => 'application/json'
    }
  end

  before do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    bypass_named_maps_requests
    @user = create(:user, private_tables_enabled: true, private_maps_enabled: true)
    @api_key = @user.api_key
    host! "#{@user.username}.localhost.lan"
  end

  describe 'POST /api/v1/viz' do
    it 'creates a visualization' do
      payload = factory.merge(type: 'table')

      post("/api/v1/viz?api_key=#{@api_key}", JSON.dump(payload), headers)

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['tags'].should == payload[:tags]
      response_body['map_id'].should == payload.fetch(:map_id)
      response_body['description'].should == payload.fetch(:description)

      payload = {}
      get("/api/v1/viz/#{response_body['id']}?api_key=#{@api_key}", JSON.dump(payload), headers)

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['name'].should_not == nil
      response_body['tags'].should_not == payload[:tags].to_json
      response_body.keys.should_not include 'related'
    end

    it 'creates a visualization from a source_visualization_id' do
      table                 = table_factory
      source_visualization  = table.fetch('table_visualization')

      payload = { source_visualization_id: source_visualization.fetch('id') }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      CartoDB::Visualization::Member.new(id: response_body['id']).fetch.derived?.should be_true
    end

    it 'creates a private visualization from a private table' do
      table1 = table_factory(privacy: 0)
      source_visualization_id = table1.fetch('table_visualization').fetch('id')
      payload = { source_visualization_id: source_visualization_id }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['privacy'].should == 'PRIVATE'
    end

    it 'creates a private visualization if any table in the list is private' do
      table3 = table_factory(privacy: 0)

      payload = {
        name: 'new visualization',
        tables: [table3.fetch('name')]
      }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['privacy'].should == 'PRIVATE'
    end

    it 'creates a private visualization if any table in the list is private' do
      table1 = table_factory
      table2 = table_factory
      table3 = table_factory(privacy: 0)

      payload = {
        name: 'new visualization',
        tables: [
          table1.fetch('name'),
          table2.fetch('name'),
          table3.fetch('name')
        ],
        privacy: 'public'
      }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['privacy'].should == 'PRIVATE'
    end

    it 'assigns a generated name if name taken' do
      table               = table_factory
      visualization       = table.fetch('table_visualization')
      visualization_name  = visualization.fetch('name')

      payload = {
        source_visualization_id:  visualization.fetch('id'),
        name:                     visualization_name
      }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body['name'].should =~ /#{visualization_name} 1/
    end
  end

  describe 'PUT /api/v1/viz/:id' do
    it 'updates an existing visualization' do
      payload = factory

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      response_body = JSON.parse(response.body)
      id = response_body.fetch('id')
      response_body.fetch('tags').should == ['foo', 'bar']

      put "/api/v1/viz/#{id}?api_key=#{@api_key}", { name: 'changed', tags: [], id: id }.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('name').should == 'changed'
      response_body.fetch('tags').should == []
    end

    it 'updates the table in a table visualization', now: true do
      table_attributes = table_factory
      id = table_attributes.fetch('table_visualization').fetch('id')

      Delorean.jump(1.minute)
      put "/api/v1/viz/#{id}?api_key=#{@api_key}", { name: 'changed name', id: id }.to_json, headers
      Delorean.back_to_the_present

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('table').fetch('updated_at').should_not == table_attributes.fetch('updated_at')
    end

    it 'returns a downcased name' do
      table_attributes = table_factory
      id = table_attributes.fetch('table_visualization').fetch('id')

      put "/api/v1/viz/#{id}?api_key=#{@api_key}", { name: 'CHANGED_NAME', id: id }.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('name').should == 'changed_name'

      get "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, headers

      response_body = JSON.parse(response.body)
      response_body.fetch('name').should == 'changed_name'
    end

    it 'returns a sanitized name' do
      table_attributes = table_factory
      id = table_attributes.fetch('table_visualization').fetch('id')

      put "/api/v1/viz/#{id}?api_key=#{@api_key}", { name: 'changed name', id: id }.to_json, headers

      response.status.should == 200
      response_body = JSON.parse(response.body)
      response_body.fetch('name').should == 'changed_name'

      get "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, headers

      response_body = JSON.parse(response.body)
      response_body.fetch('name').should == 'changed_name'
    end
  end

  describe 'DELETE /api/v1/viz/:id' do
    it 'deletes the visualization' do
      payload = factory

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, headers

      id = JSON.parse(response.body).fetch('id')

      get "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, headers

      response.status.should == 200

      delete "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, headers

      response.status.should == 204
      response.body.should be_empty

      get "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, headers

      response.status.should == 404
    end

    it 'deletes the associated table' do
      table_attributes = table_factory
      table_id = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}", {}, headers

      response.status.should == 200
      table             = JSON.parse(response.body)
      visualization_id  = table.fetch('table_visualization').fetch('id')

      delete "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}", {}, headers

      response.status.should == 204

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}", {}, headers

      response.status.should == 404
    end
  end
end
