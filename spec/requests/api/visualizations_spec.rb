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
require 'helpers/unique_names_helper'


def app
  CartoDB::Application.new
end

# INFO: THIS TEST SUITE SHOULD NOT GET NEW TESTS. In order to test visualization controller
# add the specs to ./spec/requests/api/json/visualizations_controller_shared_examples.rb instead.
# You can then run it with ./spec/requests/api/json/visualizations_controller_specs.rb and
# ./spec/requests/carto/api/visualizations_controller_specs.rb.
describe Api::Json::VisualizationsController do
  include UniqueNamesHelper
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
    stub_named_maps_calls
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
    }
    host! 'test.localhost.lan'
  end

  after(:all) do
    stub_named_maps_calls
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

  describe '#slides_sorting' do
    it 'checks proper working of prev/next' do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)

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

  # Visualizations are always created with default_privacy
  def factory(attributes={})
    {
      name:                     attributes.fetch(:name, unique_name('viz')),
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

    name    = unique_name('table')
    payload = {
      name:         name,
      description:  "#{name} description"
    }
    post "/api/v1/tables?api_key=#{@api_key}",
      payload.to_json, @headers

    table_attributes  = JSON.parse(last_response.body)
    table_id          = table_attributes.fetch('table_visualization').fetch("id")

    put "/api/v1/viz/#{table_id}?api_key=#{@api_key}",
      { privacy: privacy }.to_json, @headers

    table_attributes
  end #table_factory
end # Api::Json::VisualizationsController
