# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require 'uri'
require_relative '../../spec_helper'
require_relative '../../../app/controllers/api/json/visualizations_controller'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/models/overlay/migrator'


def app
  CartoDB::Application.new
end

describe Api::Json::VisualizationsController do
  include Rack::Test::Methods
  include DataRepository

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @user = create_user(
      username: 'test',
      email:    'client@example.com',
      password: 'clientex',
      private_tables_enabled: 'true'
    )
    @api_key = @user.api_key
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    @db = Rails::Sequel.connection
    Sequel.extension(:pagination)

    CartoDB::Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
    CartoDB::Overlay.repository       = DataRepository::Backend::Sequel.new(@db, :overlays)

    begin
      delete_user_data @user
    rescue => exception
      # Silence named maps problems only here upon data cleaning, not in specs
      raise unless exception.class.to_s == 'CartoDB::NamedMapsWrapper::HTTPResponseError'
    end

    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
  end

  after(:all) do
    @user.destroy
  end

  describe 'POST /api/v1/viz' do
    it 'creates a visualization' do
      pending
      payload = factory.merge(type: 'table')

      post "/api/v1/viz?api_key=#{@api_key}",
            payload.to_json, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('name')        .should =~ /visualization/
      response.fetch('tags')        .should == payload.fetch(:tags)
      response.fetch('map_id')      .should == payload.fetch(:map_id)
      response.fetch('description') .should == payload.fetch(:description)

      id      = response.fetch('id')
      map_id  = response.fetch('map_id')

      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should ==  200

      response = JSON.parse(last_response.body)
      response.fetch('name')        .should_not == nil
      response.fetch('tags')        .should_not == payload.fetch(:tags).to_json
      response.keys.should_not include 'related'

      payload = { kind: 'carto', order: 1 }
      post "/api/v1/maps/#{map_id}/layers?api_key=#{@api_key}",
        payload.to_json, @headers
      last_response.status.should == 200

      payload = { kind: 'carto', order: 2 }
      post "/api/v1/maps/#{map_id}/layers?api_key=#{@api_key}",
        payload.to_json, @headers
      last_response.status.should == 400
    end

    it 'creates a visualization from a source_visualization_id' do
      pending
      table                 = table_factory
      source_visualization  = table.fetch('table_visualization')

      payload = { source_visualization_id: source_visualization.fetch('id') }
      
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      last_response.status.should == 200
    end

    it 'creates a visualization from a list of tables' do
      pending
      table1 = table_factory
      table2 = table_factory
      table3 = table_factory

      payload = {
        name: 'new visualization',
        tables: [
          table1.fetch('name'),
          table2.fetch('name'),
          table3.fetch('name')
        ],
        privacy: 'public'
      }

      post "/api/v1/viz?api_key=#{@api_key}",
            payload.to_json, @headers
      last_response.status.should == 200

      visualization = JSON.parse(last_response.body)

      get "/api/v1/viz/#{visualization.fetch('id')}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 403

      get "/api/v2/viz/#{visualization.fetch('id')}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      # include overlays

      get "/api/v1/viz/#{visualization.fetch('id')}/overlays?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      overlays = JSON.parse(last_response.body)
      overlays.length.should == 9
    end

    it 'creates a private visualization from a private table' do
      pending
      table1 = table_factory(privacy: 0)
      source_visualization_id = table1.fetch('table_visualization').fetch('id')
      payload = { source_visualization_id: source_visualization_id }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should == 200

      visualization = JSON.parse(last_response.body)
      visualization.fetch('privacy').should == 'PRIVATE'
    end

    it 'creates a private visualization if any table in the list is private' do
      pending
      table3 = table_factory(privacy: 0)

      payload = {
        name: 'new visualization',
        tables: [table3.fetch('name')]
      }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should == 200

      visualization = JSON.parse(last_response.body)
      visualization.fetch('privacy').should == 'PRIVATE'
    end

    it 'creates a private visualization if any table in the list is private' do
      pending
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

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      last_response.status.should == 200

      visualization = JSON.parse(last_response.body)
      visualization.fetch('privacy').should == 'PRIVATE'
    end

    it 'assigns a generated name if name taken' do
      pending
      table               = table_factory
      visualization       = table.fetch('table_visualization')
      visualization_name  = visualization.fetch('name')

      payload = {
        source_visualization_id:  visualization.fetch('id'),
        name:                     visualization_name
      }
      
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      last_response.status.should == 200

      response  = JSON.parse(last_response.body)
      response.fetch('name').should =~ /#{visualization_name} 0/
    end
  end # POST /api/v1/viz

  describe 'GET /api/v1/viz' do
    it 'retrieves a collection of visualizations' do
      pending
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.first.fetch('id').should == id
    end

    it 'is updated after creating a visualization' do
      pending
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 1

      payload = factory.merge('name' => 'another one')
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end

    it 'is updated after deleting a visualization' do
      pending
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should_not be_empty

      delete "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      get "/api/v1/viz?api_key=#{@api_key}",
        {}, @headers

      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty
    end

    it 'paginates results' do
      pending
      per_page      = 10
      total_entries = 20

      total_entries.times do 
        post "/api/v1/viz?api_key=#{@api_key}",
          factory.to_json, @headers
      end

      get "/api/v1/viz?api_key=#{@api_key}&page=1&per_page=#{per_page}", {}, @headers

      last_response.status.should == 200
      
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should == per_page
      response.fetch('total_entries').should == total_entries
    end

    it 'returns filtered results' do
      pending
      post "/api/v1/viz?api_key=#{@api_key}",
        factory.to_json, @headers

      get "/api/v1/viz?api_key=#{@api_key}&type=table",
        {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.should be_empty

      post "/api/v1/viz?api_key=#{@api_key}",
        factory.to_json, @headers
      post "/api/v1/viz?api_key=#{@api_key}",
        factory.merge(type: 'table').to_json, @headers
      get "/api/v1/viz?api_key=#{@api_key}&type=derived",
        {}, @headers

      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.size.should == 2
    end

    it 'does not get table data if passed table_data=false' do
      pending
      table = table_factory

      get "/api/v1/viz?api_key=#{@api_key}&type=table",
        {}, @headers
      last_response.status.should == 200
      response        = JSON.parse(last_response.body)
      visualizations  = response.fetch('visualizations')
      visualizations.first.keys.should_not include :table_data
    end
  end # GET /api/v1/viz

  describe 'GET /api/v1/viz/:id' do
    it 'returns a visualization' do
      pending
      payload = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')
      
      get "/api/v1/viz/#{id}?api_key=#{@api_key}", 
        {}, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('id')              .should_not be_nil
      response.fetch('map_id')          .should_not be_nil
      response.fetch('tags')            .should_not be_empty
      response.fetch('description')     .should_not be_nil
      response.fetch('related_tables')  .should_not be_nil
    end
  end # GET /api/v1/viz/:id

  describe 'GET /api/v1/viz/:id/stats' do
    it 'returns view stats for the visualization' do
      pending
      payload = factory

      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers
      id = JSON.parse(last_response.body).fetch('id')

      get "/api/v1/viz/#{id}/stats?api_key=#{@api_key}", {}, @headers

      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.keys.length.should == 30
    end
  end # GET /api/v1/viz/:id/stats

  describe 'PUT /api/v1/viz/:id' do
    it 'updates an existing visualization' do
      pending
      payload   = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      response  =  JSON.parse(last_response.body)
      id        = response.fetch('id')
      tags      = response.fetch('tags')

      response.fetch('tags').should == ['foo', 'bar']

      put "/api/v1/viz/#{id}?api_key=#{@api_key}",
        { name: 'changed', tags: [] }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('name').should == 'changed'
      response.fetch('tags').should == []
    end

    it 'updates the table in a table visualization', now: true do
      pending
      table_attributes = table_factory
      id = table_attributes.fetch('table_visualization').fetch('id')

      sleep(0.6)
      put "/api/v1/viz/#{id}?api_key=#{@api_key}",
        { name: 'changed name' }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)

      response.fetch('table').fetch('updated_at')
        .should_not == table_attributes.fetch('updated_at')
    end

    it 'allows setting the active layer' do
      pending
      payload   = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      response  =  JSON.parse(last_response.body)
      id        = response.fetch('id')
      tags      = response.fetch('tags')

      response.fetch('tags').should == ['foo', 'bar']

      active_layer_id = 8
      put "/api/v1/viz/#{id}?api_key=#{@api_key}",
        { active_layer_id: active_layer_id }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('active_layer_id').should == active_layer_id
      response.fetch('tags').should == ['foo', 'bar']
    end

    it 'returns a sanitized name' do
      pending
      table_attributes = table_factory
      id = table_attributes.fetch('table_visualization').fetch('id')

      put "/api/v1/viz/#{id}?api_key=#{@api_key}",
        { name: 'changed name' }.to_json, @headers
      last_response.status.should == 200
      response = JSON.parse(last_response.body)
      response.fetch('name').should == 'changed_name'

      get "/api/v1/viz/#{id}?api_key=#{@api_key}", {}, @headers
      response = JSON.parse(last_response.body)
      response.fetch('name').should == 'changed_name'
    end
  end # PUT /api/v1/viz/:id

  describe 'DELETE /api/v1/viz/:id' do
    it 'deletes the visualization' do
      pending
      payload   = factory
      post "/api/v1/viz?api_key=#{@api_key}",
        payload.to_json, @headers

      id = JSON.parse(last_response.body).fetch('id')
      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      delete "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 204
      last_response.body.should be_empty

      get "/api/v1/viz/#{id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end

    it 'deletes the associated table' do
      pending
      table_attributes = table_factory
      table_id         = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      table             = JSON.parse(last_response.body)
      visualization_id  = table.fetch('table_visualization').fetch('id')

      delete "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 204

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end
  end # DELETE /api/v1/viz/:id

  describe 'DELETE /api/v1/tables/:id' do
    it 'deletes the associated table visualization' do
      pending
      table_attributes = table_factory
      table_id         = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      table             = JSON.parse(last_response.body)
      visualization_id  = table.fetch('table_visualization').fetch('id')

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200

      delete "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end

    it 'deletes dependent visualizations' do
      pending
      table_attributes = table_factory
      table_id         = table_attributes.fetch('id')

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      table                   = JSON.parse(last_response.body)
      source_visualization_id = table.fetch('table_visualization').fetch('id')

      payload = { source_visualization_id: source_visualization_id }
      
      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      response          = JSON.parse(last_response.body)
      visualization_id  = response.fetch('id')

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200

      delete "/api/v1/tables/#{table_id}?api_key=#{@api_key}", {}, @headers
      
      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v1/viz/#{source_visualization_id}?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 404
    end

    it 'removes the layer from non dependent visualizations' do
      pending
      table1    = table_factory
      table2    = table_factory
      table1_id = table1.fetch('id')
      table2_id = table1.fetch('id')

      payload = { tables: [table1.fetch('name'), table2.fetch('name')] }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      response          = JSON.parse(last_response.body)
      visualization_id  = response.fetch('id')
      map_id            = response.fetch('map_id')

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200

      JSON.parse(last_response.body).fetch('related_tables').length
        .should == 2

      get "/api/v1/tables/#{table1_id}?api_key=#{@api_key}", {}, @headers
      table1 = JSON.parse(last_response.body)
      table1.fetch('non_dependent_visualizations').length.should == 1
      table1.fetch('dependent_visualizations').length.should == 0

      get "/api/v1/tables/#{table2_id}?api_key=#{@api_key}", {}, @headers
      table2 = JSON.parse(last_response.body)
      table2.fetch('non_dependent_visualizations').length.should == 1
      table2.fetch('dependent_visualizations').length.should == 0

      delete "/api/v1/tables/#{table1_id}?api_key=#{@api_key}", {}, @headers

      get "/api/v1/tables/#{table1_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v1/viz/#{visualization_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('related_tables').length
        .should == 1

      get "/api/v1/maps/#{map_id}/layers?api_key=#{@api_key}", {}, @headers
      JSON.parse(last_response.body).length.should == 2
    end

    it 'removes dependent visualizations that have the same layer twice' do
      pending
      table     = table_factory
      table_id  = table.fetch('id')
      payload   = { tables: [table.fetch('name'), table.fetch('name')] }

      post "/api/v1/viz?api_key=#{@api_key}", payload.to_json, @headers
      response          = JSON.parse(last_response.body)
      visualization_id  = response.fetch('id')
      map_id            = response.fetch('map_id')

      delete "/api/v1/tables/#{table_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 204

      get "/api/v1/tables/#{table_id}?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v1/tables?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200
    end
  end # DELETE /api/v1/tables/:id

  describe 'GET /api/v1/viz/:id/viz' do
    it 'renders vizjson v1' do
      pending
      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get "/api/v1/viz/#{table_id}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      response = ::JSON.parse(last_response.body)
      response.keys.length.should > 1
      response.fetch('description').should_not be_empty
    end
  end # GET /api/v1/viz/:id/viz

  describe 'GET /api/v2/viz/:id/viz' do
    it 'renders vizjson v2' do
      pending
      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}",
        {}, @headers
      last_response.status.should == 200
      ::JSON.parse(last_response.body).keys.length.should > 1
    end
  end # GET /api/v2/viz/:id/viz

  describe 'non existent visualization' do
    it 'returns 404' do
      pending

      get "/api/v1/viz/9999?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v1/viz/9999/stats?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      put "/api/v1/viz/9999?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      delete "/api/v1/viz/9999?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v1/viz/9999/viz?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/api/v2/viz/9999/viz?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404
    end
  end # non existent visualization

  describe 'tests visualization listing filters' do
    it 'uses locked filter' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      post "/api/v1/viz?api_key=#{@api_key}", factory(locked: true).to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')
      post "/api/v1/viz?api_key=#{@api_key}", factory(locked: false).to_json, @headers
      vis_2_id = JSON.parse(last_response.body).fetch('id')

      get "/api/v1/viz?api_key=#{@api_key}&type=derived", {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 2

      get "/api/v1/viz?api_key=#{@api_key}&type=derived&locked=true", {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 1
      collection.first.fetch('id').should eq vis_1_id

      get "/api/v1/viz?api_key=#{@api_key}&type=derived&locked=false", {}, @headers
      last_response.status.should == 200
      response    = JSON.parse(last_response.body)
      collection  = response.fetch('visualizations')
      collection.length.should eq 1
      collection.first.fetch('id').should eq vis_2_id
    end
  end

  describe '#slides_sorting' do
    it 'checks proper working of prev/next' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      map_id = ::Map.create(user_id: @user.id).id

      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           factory({
                     name: 'PARENT',
                     type: CartoDB::Visualization::Member::TYPE_DERIVED
                   }).to_json, @headers
      body = JSON.parse(last_response.body)
      parent_vis_id = body.fetch('id')

      # A
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: 'A',
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             parent_id: parent_vis_id,
             map_id: map_id
           }.to_json, @headers
      body = JSON.parse(last_response.body)
      vis_a_id = body.fetch('id')
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq nil

      # standalone
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           factory(name: 'standalone').to_json, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq nil

      # A -> B
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: 'B',
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             parent_id: parent_vis_id,
             map_id: map_id,
             prev_id: vis_a_id
           }.to_json, @headers
      body = JSON.parse(last_response.body)
      vis_b_id = body.fetch('id')
      body.fetch('prev_id').should eq vis_a_id
      body.fetch('next_id').should eq nil

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_a_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq vis_b_id
      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_b_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_a_id
      body.fetch('next_id').should eq nil

      # C -> A -> B
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: 'C',
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             parent_id: parent_vis_id,
             map_id: map_id,
             next_id: vis_a_id
           }.to_json, @headers
      body = JSON.parse(last_response.body)
      vis_c_id = body.fetch('id')
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq vis_a_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_c_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq vis_a_id
      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_a_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_c_id
      body.fetch('next_id').should eq vis_b_id
      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_b_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_a_id
      body.fetch('next_id').should eq nil

      # C -> D -> A -> B
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: 'D',
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             parent_id: parent_vis_id,
             map_id: map_id,
             prev_id: vis_c_id,
             next_id: vis_a_id
           }.to_json, @headers
      body = JSON.parse(last_response.body)
      vis_d_id = body.fetch('id')
      body.fetch('prev_id').should eq vis_c_id
      body.fetch('next_id').should eq vis_a_id


      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_c_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq vis_d_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_d_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_c_id
      body.fetch('next_id').should eq vis_a_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_a_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_d_id
      body.fetch('next_id').should eq vis_b_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_b_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_a_id
      body.fetch('next_id').should eq nil

      # C -> A -> B -> D
      put api_v1_visualizations_set_next_id_url(user_domain: @user.username, api_key: @api_key, id: vis_d_id),
           { next_id: nil }.to_json, @headers
      last_response.status.should == 200

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_c_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq nil
      body.fetch('next_id').should eq vis_a_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_a_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_c_id
      body.fetch('next_id').should eq vis_b_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_b_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_a_id
      body.fetch('next_id').should eq vis_d_id

      get api_v1_visualizations_show_url(user_domain: @user.username, api_key: @api_key, id: vis_d_id),
          {}, @headers
      body = JSON.parse(last_response.body)
      body.fetch('prev_id').should eq vis_b_id
      body.fetch('next_id').should eq nil
    end
  end

  describe '#source_visualization_id_and_hierarchy' do
    it 'checks proper working of parent_id' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      map_id = ::Map.create(user_id: @user.id).id

      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
       factory({
                 name: "PARENT #{UUIDTools::UUID.timestamp_create.to_s}",
                 type: CartoDB::Visualization::Member::TYPE_DERIVED
               }).to_json, @headers
      body = JSON.parse(last_response.body)
      parent_vis_id = body.fetch('id')

      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: "CHILD 1 #{UUIDTools::UUID.timestamp_create.to_s}",
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             parent_id: parent_vis_id,
             map_id: map_id
           }.to_json, @headers
      vis_1_body = JSON.parse(last_response.body)

      # This should also set as next sibiling of vis_1 as has no prev_id/next_id set
      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
           {
             name: "CHILD 2 #{UUIDTools::UUID.timestamp_create.to_s}",
             type: CartoDB::Visualization::Member::TYPE_SLIDE,
             source_visualization_id: vis_1_body.fetch('id'),
             parent_id: parent_vis_id
           }.to_json, @headers
      vis_2_body = JSON.parse(last_response.body)

      vis_2_body.fetch('prev_id').should eq vis_1_body.fetch('id')

      vis_2_body.fetch('parent_id').should eq vis_1_body.fetch('parent_id')
      vis_1_body.fetch('parent_id').should eq parent_vis_id
      vis_2_body.fetch('id').should_not eq vis_1_body.fetch('id')
    end
  end

  describe 'tests visualization likes endpoints' do
    it 'tests like endpoints' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_2 = create_user(
        username: 'test2',
        email:    'client2@example.com',
        password: 'clientex'
      )

      post api_v1_visualizations_create_url(user_domain: @user.username, api_key: @api_key),
        factory.to_json, @headers
      vis_1_id = JSON.parse(last_response.body).fetch('id')

      get api_v1_visualizations_likes_count_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

      get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('likes').should eq []

      get api_v1_visualizations_is_liked_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)

      post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

      get api_v1_visualizations_is_liked_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('liked').should eq true

      get api_v1_visualizations_likes_count_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

      get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user.id}]

      post api_v1_visualizations_add_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 2

      get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      # Careful with order of array items
      (JSON.parse(last_response.body).fetch('likes') - [
                                                         {'actor_id' => @user.id},
                                                         {'actor_id' => user_2.id}
                                                       ]).should eq []

      delete api_v1_visualizations_remove_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

      # No effect expected
      delete api_v1_visualizations_remove_like_url(user_domain: user_2.username, id: vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

      post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      last_response.status.should == 400
      last_response.body.should eq "You've already liked this visualization"

      delete api_v1_visualizations_remove_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 0

      post api_v1_visualizations_add_like_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      last_response.status.should == 200
      JSON.parse(last_response.body).fetch('likes').to_i.should eq 1

      get api_v1_visualizations_likes_list_url(user_domain: @user.username, id: vis_1_id, api_key: @api_key)
      JSON.parse(last_response.body).fetch('likes').should eq [{'actor_id' => @user.id}]

      user_2.destroy
    end
  end

  describe 'index endpoint' do
    it 'tests normal users authenticated and unauthenticated calls' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_2 = create_user(
        username: 'testindexauth',
        email:    'test_auth@example.com',
        password: 'testauth',
        private_maps_enabled: true
      )

      collection = CartoDB::Visualization::Collection.new.fetch(user_id: user_2.id)
      collection.map(&:delete)

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      pub_vis_id = JSON.parse(last_response.body).fetch('id')

      put api_v1_visualizations_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: pub_vis_id),
           {
             privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
           }.to_json, @headers
      last_response.status.should == 200

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      priv_vis_id = JSON.parse(last_response.body).fetch('id')

      put api_v1_visualizations_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: priv_vis_id),
           {
             privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
           }.to_json, @headers
      last_response.status.should == 200

      get api_v1_visualizations_index_url(user_domain: user_2.username, type: 'derived'), @headers
      body = JSON.parse(last_response.body)

      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq pub_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

      get api_v1_visualizations_index_url(user_domain: user_2.username, type: 'derived', api_key: user_2.api_key,
                                          order: 'updated_at'),
        {}, @headers
      body = JSON.parse(last_response.body)

      body['total_entries'].should eq 2
      vis = body['visualizations'][0]
      vis['id'].should eq priv_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
      vis = body['visualizations'][1]
      vis['id'].should eq pub_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase
    end

    it 'tests organization users authenticated and unauthenticated calls' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      org_name = "org#{rand(9999)}"

      user_2 = create_user(
        username: "test#{rand(9999)}",
        email:    "client#{rand(9999)}@cartodb.com",
        password: 'clientex'
      )

      organization = Organization.new
      organization.name = org_name
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_2.id)
      user_org.promote_user_to_admin
      organization.reload
      user_2.reload

      post "http://#{org_name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                               api_key: user_2.api_key)}",
           factory.to_json, @headers
      last_response.status.should == 200
      pub_vis_id = JSON.parse(last_response.body).fetch('id')

      put "http://#{org_name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                             api_key: user_2.api_key,
                                                                             id: pub_vis_id)}",
          {
            privacy: CartoDB::Visualization::Member::PRIVACY_PUBLIC
          }.to_json, @headers
      last_response.status.should == 200

      post "http://#{org_name}.cartodb.test#{api_v1_visualizations_create_path(user_domain: user_2.username,
                                                                              api_key: user_2.api_key)}",
           factory.to_json, @headers
      last_response.status.should == 200
      priv_vis_id = JSON.parse(last_response.body).fetch('id')

      put "http://#{org_name}.cartodb.test#{api_v1_visualizations_update_path(user_domain: user_2.username,
                                                                             api_key: user_2.api_key,
                                                                             id: priv_vis_id)}",
          {
            privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
          }.to_json, @headers
      last_response.status.should == 200

      get "http://#{org_name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                             type: 'derived')}", @headers
      body = JSON.parse(last_response.body)

      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq pub_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase


      get "http://#{org_name}.cartodb.test#{api_v1_visualizations_index_path(user_domain: user_2.username,
                                                                             api_key: user_2.api_key,
                                                                             type: 'derived',
                                                                             order: 'updated_at')}", {}, @headers
      body = JSON.parse(last_response.body)

      body['total_entries'].should eq 2
      vis = body['visualizations'][0]
      vis['id'].should eq priv_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PRIVATE.upcase
      vis = body['visualizations'][1]
      vis['id'].should eq pub_vis_id
      vis['privacy'].should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC.upcase

      user_2.destroy
    end

    it 'tests exclude_shared and only_shared filters' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_1 = create_user(
        username: "test#{rand(9999)}-1",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      user_2 = create_user(
        username: "test#{rand(9999)}-2",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: false
      )

      organization = Organization.new
      organization.name = "org#{rand(9999)}"
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table#{rand(9999)}_1", user_id: user_1.id)
      u1_t_1_id = table.table_visualization.id
      u1_t_1_perm_id = table.table_visualization.permission.id

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table#{rand(9999)}_2", user_id: user_2.id)
      u2_t_1_id = table.table_visualization.id

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      u1_vis_1_id = JSON.parse(last_response.body).fetch('id')
      u1_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      u2_vis_1_id = JSON.parse(last_response.body).fetch('id')

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      vis = body['visualizations'].first
      vis['id'].should eq u2_vis_1_id

      # Share u1 vis with u2
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
          {acl: [{
            type: CartoDB::Permission::TYPE_USER,
            entity: {
              id:   user_2.id,
            },
            access: CartoDB::Permission::ACCESS_READONLY
          }]}.to_json, @headers
      last_response.status.should == 200

      # Vis listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      # Permissions don't change updated_at
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Same with 'shared' filter (convenience alias for not handling both exclude_shared and only_shared)
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_YES), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_vis_1_id
      body['visualizations'][1]['id'].should eq u1_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_NO), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_vis_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at',
          shared: CartoDB::Visualization::Collection::FILTER_SHARED_ONLY), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_vis_1_id

      # Share u1 table with u2
      put api_v1_permissions_update_url(user_domain:user_1.username, api_key: user_1.api_key, id: u1_t_1_perm_id),
          {acl: [{
                   type: CartoDB::Permission::TYPE_USER,
                   entity: {
                     id:   user_2.id,
                   },
                   access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
      last_response.status.should == 200

      # Dunno why (rack test error?) but this call seems to cache previous params, so just call it to "flush" them
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          shared: 'wadus',
          exclude_shared: false,
          only_shared: false),
          @headers
      # -------------

      # Table listing checks
      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: false), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['visualizations'][0]['id'].should eq u2_t_1_id
      body['visualizations'][1]['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          exclude_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u2_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_2.username, api_key: user_2.api_key,
          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at',
          only_shared: true), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['visualizations'][0]['id'].should eq u1_t_1_id
    end

    it 'tests totals calculations' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_1 = create_user(
          username: "test#{rand(9999)}-1",
          email: "client#{rand(9999)}@cartodb.com",
          password: 'clientex',
          private_tables_enabled: false
      )

      user_2 = create_user(
          username: "test#{rand(9999)}-2",
          email: "client#{rand(9999)}@cartodb.com",
          password: 'clientex',
          private_tables_enabled: false
      )

      organization = Organization.new
      organization.name = "org#{rand(9999)}"
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      # user 1 will have 1 table and 1 vis
      # user 2 will have 2 of each
      # user 2 will share 1 table and 1 vis with the org
      # user 2 will share the other table and other vis with user 1

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_1_1", user_id: user_1.id)
      u1_t_1_id = table.table_visualization.id

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_2_2", user_id: user_2.id)
      u2_t_1_id = table.table_visualization.id
      u2_t_1_perm_id = table.table_visualization.permission.id

      table = create_table(privacy: UserTable::PRIVACY_PUBLIC, name: "table_#{rand(9999)}_2_2", user_id: user_2.id)
      u2_t_2_id = table.table_visualization.id
      u2_t_2_perm_id = table.table_visualization.permission.id

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      u1_vis_1_id = JSON.parse(last_response.body).fetch('id')

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      u2_vis_1_id = JSON.parse(last_response.body).fetch('id')
      u2_vis_1_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

      post api_v1_visualizations_create_url(user_domain: user_2.username, api_key: user_2.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      u2_vis_2_id = JSON.parse(last_response.body).fetch('id')
      u2_vis_2_perm_id = JSON.parse(last_response.body).fetch('permission').fetch('id')

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_CANONICAL), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['total_likes'].should eq 0
      body['total_shared'].should eq 0
      vis = body['visualizations'].first
      vis['id'].should eq u1_t_1_id

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_DERIVED), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 1
      body['total_likes'].should eq 0
      body['total_shared'].should eq 0
      vis = body['visualizations'].first
      vis['id'].should eq u1_vis_1_id

      # Share u2 vis1 with organization
      put api_v1_permissions_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: u2_vis_1_perm_id),
          {acl: [{
                     type: CartoDB::Permission::TYPE_ORGANIZATION,
                     entity: {
                         id:   organization.id,
                     },
                     access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
      last_response.status.should == 200

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['total_likes'].should eq 0
      body['total_shared'].should eq 1

      # Share u2 vis2 with u1
      put api_v1_permissions_update_url(user_domain: user_2.username, api_key: user_2.api_key, id: u2_vis_2_perm_id),
          {acl: [{
                     type: CartoDB::Permission::TYPE_USER,
                     entity: {
                         id:   user_1.id,
                     },
                     access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
      last_response.status.should == 200

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 0
      body['total_shared'].should eq 2

      post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 1
      body['total_shared'].should eq 2

      # Multiple likes to same vis shouldn't increment total as is per vis
      post api_v1_visualizations_add_like_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_1.api_key)

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_DERIVED, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 1
      body['total_shared'].should eq 2


      # Share u2 table1 with org
      put api_v1_permissions_update_url(user_domain:user_2.username, api_key: user_2.api_key, id: u2_t_1_perm_id),
          {acl: [{
                     type: CartoDB::Permission::TYPE_ORGANIZATION,
                     entity: {
                         id:   organization.id,
                     },
                     access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 2
      body['total_likes'].should eq 0
      body['total_shared'].should eq 1

      # Share u2 table2 with org
      put api_v1_permissions_update_url(user_domain:user_2.username, api_key: user_2.api_key, id: u2_t_2_perm_id),
          {acl: [{
                     type: CartoDB::Permission::TYPE_USER,
                     entity: {
                         id:   user_1.id,
                     },
                     access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 0
      body['total_shared'].should eq 2

      post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_t_1_id, api_key: user_1.api_key)

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 1
      body['total_shared'].should eq 2

      # Multiple likes to same table shouldn't increment total as is per vis
      post api_v1_visualizations_add_like_url(user_domain: user_1.username, id: u1_t_1_id, api_key: user_2.api_key)

      get api_v1_visualizations_index_url(user_domain: user_1.username, api_key: user_1.api_key,
                                          type: CartoDB::Visualization::Member::TYPE_CANONICAL, order: 'updated_at'), @headers
      body = JSON.parse(last_response.body)
      body['total_entries'].should eq 3
      body['total_likes'].should eq 1
      body['total_shared'].should eq 2
    end

    it 'tests privacy of vizjsons' do
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

      user_1 = create_user(
        username: "test#{rand(9999)}-1",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: true
      )

      user_2 = create_user(
        username: "test#{rand(9999)}-2",
        email: "client#{rand(9999)}@cartodb.com",
        password: 'clientex',
        private_tables_enabled: true
      )

      organization = Organization.new
      organization.name = "org#{rand(9999)}"
      organization.quota_in_bytes = 1234567890
      organization.seats = 5
      organization.save
      organization.valid?.should eq true

      user_org = CartoDB::UserOrganization.new(organization.id, user_1.id)
      user_org.promote_user_to_admin
      organization.reload
      user_1.reload

      user_2.organization_id = organization.id
      user_2.save.reload
      organization.reload

      post api_v1_visualizations_create_url(user_domain: user_1.username, api_key: user_1.api_key),
           factory.to_json, @headers
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      u1_vis_1_id = body.fetch('id')
      u1_vis_1_perm_id = body.fetch('permission').fetch('id')
      # By default derived vis from private tables are WITH_LINK, so setprivate
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          { privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE }.to_json, @headers
      last_response.status.should == 200

      # Share vis with user_2 in readonly (vis can never be shared in readwrite)
      put api_v1_permissions_update_url(user_domain: user_1.username, api_key: user_1.api_key, id: u1_vis_1_perm_id),
          {acl: [{
                   type: CartoDB::Permission::TYPE_USER,
                   entity: {
                     id:   user_2.id,
                   },
                   access: CartoDB::Permission::ACCESS_READONLY
                 }]}.to_json, @headers
      last_response.status.should == 200

      # privacy private checks
      # ----------------------

      # Owner, authenticated
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user, has it shared in readonly mode
      get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
      last_response.status.should == 403

      # Unauthenticated user
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
      last_response.status.should == 403

      # Now with link
      # -------------
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          { privacy: CartoDB::Visualization::Member::PRIVACY_LINK }.to_json, @headers
      last_response.status.should == 200

      # Owner authenticated
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user has it shared in readonly mode
      get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Now public
      # ----------
      put api_v1_visualizations_update_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key),
          { privacy: CartoDB::Visualization::Member::PRIVACY_LINK }.to_json, @headers
      last_response.status.should == 200

      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: user_1.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Other user has it shared in readonly mode
      get api_v2_visualizations_vizjson_url(user_domain: user_2.username, id: u1_vis_1_id, api_key: user_2.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

      # Unauthenticated user
      get api_v2_visualizations_vizjson_url(user_domain: user_1.username, id: u1_vis_1_id, api_key: @user.api_key)
      last_response.status.should == 200
      body = JSON.parse(last_response.body)
      body['id'].should eq u1_vis_1_id

    end

    it 'Sanitizes vizjson callback' do
      valid_callback = 'my_function'
      valid_callback2 = 'a'
      invalid_callback1 = 'alert(1);'
      invalid_callback2 = '%3B'
      invalid_callback3 = '123func'    # JS names cannot start by number

      table_attributes  = table_factory
      table_id          = table_attributes.fetch('id')
      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=#{valid_callback}", {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^#{valid_callback}\(\{/i).should eq 0

      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=#{invalid_callback1}", {}, @headers
      last_response.status.should == 400

      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=#{invalid_callback2}", {}, @headers
      last_response.status.should == 400

      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=#{invalid_callback3}", {}, @headers
      last_response.status.should == 400

      # if param specified, must not be empty
      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=", {}, @headers
      last_response.status.should == 400

      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}&callback=#{valid_callback2}", {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^#{valid_callback2}\(\{/i).should eq 0

      get "/api/v2/viz/#{table_id}/viz?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 200
      (last_response.body =~ /^\{/i).should eq 0
    end

end

  # Visualizations are always created with default_privacy
  def factory(attributes={})
    {
      name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
      tags:                     attributes.fetch(:tags, ['foo', 'bar']),
      map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: @user.id).id),
      description:              attributes.fetch(:description, 'bogus'),
      type:                     attributes.fetch(:type, 'derived'),
      privacy:                  attributes.fetch(:privacy, 'public'),
      source_visualization_id:  attributes.fetch(:source_visualization_id, nil),
      parent_id:                attributes.fetch(:parent_id, nil),
      locked:                   attributes.fetch(:locked, false),
      prev_id:                  attributes.fetch(:prev_id, nil),
      next_id:                  attributes.fetch(:next_id, nil)
    }
  end

  def table_factory(options={})
    privacy = options.fetch(:privacy, 1)

    seed    = rand(9999)
    payload = { 
      name:         "table #{seed}",
      description:  "table #{seed} description"
    }
    post "/api/v1/tables?api_key=#{@api_key}",
      payload.to_json, @headers

    table_attributes  = JSON.parse(last_response.body)
    table_id          = table_attributes.fetch('id')

    put "/api/v1/tables/#{table_id}?api_key=#{@api_key}",
      { privacy: privacy }.to_json, @headers

    table_attributes
  end #table_factory
end # Api::Json::VisualizationsController

