# encoding: utf-8
require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../support/factories/organizations'
require_relative '../../../app/models/visualization/migrator'
require_relative '../../../app/controllers/admin/visualizations_controller'
require_relative '../../../services/relocator/relocator'
require_relative '../../../services/relocator/worker'
require_relative '../../../services/relocator/relocator/table_dumper'

def app
  CartoDB::Application.new
end #app

describe Admin::VisualizationsController do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper

  before(:all) do
    @user = create_user(
      username: 'test',
      email:    'test@test.com',
      password: 'test12',
      private_tables_enabled: true
    )
    @api_key = @user.api_key
    @user.stubs(:should_load_common_data?).returns(false)
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
    
    @db = Rails::Sequel.connection
    Sequel.extension(:pagination)

    CartoDB::Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)

    delete_user_data @user
    @headers = { 
      'CONTENT_TYPE'  => 'application/json',
    }
    host! 'test.localhost.lan'
  end

  after(:all) do
    @user.destroy
  end

  describe "GET map feeds" do
    it "returns an RSS feed" do
      get "/maps/feed.rss"
      last_response.status.should == 200
      last_response.content_type.should eq("application/rss+xml; charset=utf-8")
    end

    it "returns an atom feed" do
      get "/maps/feed"
      last_response.status.should == 200
      last_response.content_type.should eq("application/atom+xml; charset=utf-8")
    end
  end

  describe 'GET /viz' do
    it 'returns a list of visualizations' do
      login_as(@user, scope: 'test')

      get "/viz", {}, @headers
      last_response.status.should == 200
    end

    it 'returns 403 if user not logged in' do
      get "/viz", {}, @headers
      last_response.status.should == 302
    end
  end # GET /viz

  describe 'GET /viz:id' do
    it 'returns a visualization' do
      id = factory.fetch('id')
      login_as(@user, scope: 'test')

      get "/viz/#{id}", {}, @headers
      last_response.status.should == 200
    end

    it 'redirects to the public view if visualization private' do
      id = factory.fetch('id')

      get "/viz/#{id}", {}, @headers
      follow_redirect!
      last_request.path.should =~ %r{/viz/}
    end

    it 'keeps the base path (table|visualization) when redirecting' do
      id = table_factory.id

      get "/tables/#{id}", {}, @headers
      follow_redirect!
      last_request.path.should =~ %r{/tables/}
    end
  end # GET /viz/:id

  describe 'GET /tables/:id/public/table' do
    it 'returns 404 for private tables' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PRIVATE).id

      get "/tables/#{id}/public/table", {}, @headers
      last_response.status.should == 404
    end
  end

  describe 'GET /viz/:id/protected_public_map' do
    it 'returns 404 for private maps' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PRIVATE).table_visualization.id

      get "/viz/#{id}/protected_public_map", {}, @headers
      last_response.status.should == 404
    end
  end

  describe 'GET /viz/:id/protected_embed_map' do
    it 'returns 404 for private maps' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PRIVATE).table_visualization.id

      get "/viz/#{id}/protected_embed_map", {}, @headers
      last_response.status.should == 404
    end
  end

  describe 'GET /viz/:id/public_map' do
    it 'returns 403 for private maps' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PRIVATE).table_visualization.id

      get "/viz/#{id}/public_map", {}, @headers
      last_response.status.should == 403
    end

    it 'returns proper surrogate-keys' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get "/viz/#{id}/public_map", {}, @headers
      last_response.status.should == 200
      last_response.headers["Surrogate-Key"].should_not be_empty
      last_response.headers["Surrogate-Key"].should include(CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES)
    end

    it 'returns public map for org users' do
      org = OrganizationFactory.new.new_organization(name: 'public-map-spec-org').save

      user_a = create_user({username: 'user-public-map', quota_in_bytes: 123456789, table_quota: 400})
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin

      vis_id = new_table({user_id: user_a.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization.id

      host! "#{org.name}.localhost.lan"
      get "/viz/#{vis_id}/public_map", @headers
      last_response.status.should == 200
    end
  end

  describe 'GET /viz/:id/public' do
    it 'returns public data for a table visualization' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 200
    end

    it 'returns a 404 if table is private' do
      id = table_factory.table_visualization.id

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 404
      last_response.body.should =~ %r{<title>CartoDB - 404 Error</title>}
    end

    it "redirects to embed_map if visualization is 'derived'" do
      id                = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id
      payload           = { source_visualization_id: id }

      post "/api/v1/viz?api_key=#{@api_key}", 
        payload.to_json, @headers
      last_response.status.should == 200

      derived_visualization = JSON.parse(last_response.body)
      id = derived_visualization.fetch('id')

      get "/viz/#{id}/public", {}, @headers
      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200
      last_request.url.should =~ %r{.*#{id}/public_map.*}
    end
  end # GET /viz/:id/public

  describe 'GET /tables/:id/embed_map' do
    it 'returns 404 for nonexisting tables when table name is used' do
      get "/tables/tablethatdoesntexist/embed_map", {}, @headers
      last_response.status.should == 404
    end
  end

  describe 'GET /viz/:name/embed_map' do
    it 'renders the view by passing a visualization name' do
      table = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC)
      name = table.table_visualization.name

      get "/viz/#{URI::encode(name)}/embed_map", {}, @headers
      last_response.status.should == 200
      last_response.headers["X-Cache-Channel"].should_not be_empty
      last_response.headers["X-Cache-Channel"].should include(table.name)
      last_response.headers["X-Cache-Channel"].should include(table.table_visualization.varnish_key)
      last_response.headers["Surrogate-Key"].should_not be_empty
      last_response.headers["Surrogate-Key"].should include(CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES)
      last_response.headers["Surrogate-Key"].should include(table.table_visualization.surrogate_key)
    end

    it 'renders embed map error page if visualization private' do
      table = table_factory
      put "/api/v1/tables/#{table.id}?api_key=#{@api_key}",
        { privacy: 0 }.to_json, @headers

      name = table.table_visualization.name
      name = URI::encode(name)

      login_as(@user, scope: 'test')

      get "/viz/#{name}/embed_map", {}, @headers
      last_response.status.should == 403
      last_response.body.should =~ /cartodb-embed-error/
    end

    it 'renders embed map error when an exception is raised' do
      login_as(@user, scope: 'test')

      get "/viz/220d2f46-b371-11e4-93f7-080027880ca6/embed_map", {}, @headers
      last_response.status.should == 404
      last_response.body.should =~ /404/
    end
  end # GET /viz/:name/embed_map

  describe 'GET /viz/:id/embed_map' do
    it 'caches and serves public embed map successful responses' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id
      embed_redis_cache = EmbedRedisCache.new

      embed_redis_cache.get(id, https=false).should == nil
      get "/viz/#{id}/embed_map", {}, @headers
      last_response.status.should == 200

      # The https key/value pair should be differenent
      embed_redis_cache.get(id, https=true).should == nil
      last_response.status.should == 200

      # It should be cached after the first request
      embed_redis_cache.get(id, https=false).should_not be_nil
      first_response = last_response

      get "/viz/#{id}/embed_map", {}, @headers
      last_response.status.should == 200
      # Headers of both responses should be the same excluding some
      remove_changing = lambda {|h| h.reject {|k, v| ['X-Request-Id', 'X-Runtime'].include?(k)} }
      remove_changing.call(first_response.headers).should == remove_changing.call(last_response.headers)
      first_response.body.should == last_response.body
    end
  end

  describe 'GET /viz/:name/track_embed' do
    it 'renders the view by passing a visualization name' do
      name = URI::encode(factory.fetch('name'))
      login_as(@user, scope: 'test')

      get "/viz/track_embed", {}, @headers
      last_response.status.should == 200
    end
  end # GET /viz/:name/track_embed

  describe 'non existent visualization' do
    it 'returns 404' do
      login_as(@user, scope: 'test')

      get "/viz/220d2f46-b371-11e4-93f7-080027880ca6?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/viz/220d2f46-b371-11e4-93f7-080027880ca6/public?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404

      get "/viz/220d2f46-b371-11e4-93f7-080027880ca6/embed_map?api_key=#{@api_key}", {}, @headers
      last_response.status.should == 404
    end
  end # non existent visualization

  describe 'org user visualization redirection' do
    it 'if A shares a (shared) vis link to B with A username, performs a redirect to B username' do
      db_config   = Rails.configuration.database_configuration[Rails.env]
      # Why not passing db_config directly to Sequel.postgres here ?
      # See https://github.com/CartoDB/cartodb/issues/421
      db = Sequel.postgres(
          host:     db_config.fetch('host'),
          port:     db_config.fetch('port'),
          database: db_config.fetch('database'),
          username: db_config.fetch('username')
      )
      CartoDB::Visualization.repository  = DataRepository::Backend::Sequel.new(db, :visualizations)

      CartoDB::UserOrganization.any_instance.stubs(:move_user_tables_to_schema).returns(nil)
      CartoDB::TablePrivacyManager.any_instance.stubs(
          :set_from_table_privacy => nil,
          :propagate_to_varnish => nil
      )

      User.any_instance.stubs(
          :enable_remote_db_user => nil,
          :after_create => nil,
          :create_schema => nil,
          :move_tables_to_schema => nil,
          :setup_schema => nil,
          :create_public_db_user => nil,
          :set_database_search_path => nil,
          :load_cartodb_functions => nil,
          :set_user_privileges => nil,
          :monitor_user_notification => nil,
          :grant_user_in_database => nil,
          :set_statement_timeouts => nil,
          :set_user_as_organization_member => nil,
          :cartodb_extension_version_pre_mu? => false,
          :rebuild_quota_trigger => nil,
          :grant_publicuser_in_database => nil
      )

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
      Table.any_instance.stubs(
          :perform_cartodb_function => nil,
          :update_cdb_tablemetadata => nil,
          :update_table_pg_stats => nil,
          :create_table_in_database! => nil,
          :get_table_id => 1,
          :grant_select_to_tiler_user => nil,
          :cartodbfy => nil,
          :set_the_geom_column! => nil
      )

      # --------TEST ITSELF-----------

      org = Organization.new
      org.name = 'vis-spec-org'
      org.quota_in_bytes = 1024 ** 3
      org.seats = 10
      org.save

      User.any_instance.stubs(:remaining_quota).returns(1000)
      user_a = create_user({username: 'user-a', quota_in_bytes: 123456789, table_quota: 400})
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin
      org.reload
      user_a.reload

      user_b = create_user({username: 'user-b', quota_in_bytes: 123456789, table_quota: 400, organization: org})

      vis_id = factory(user_a).fetch('id')
      vis = CartoDB::Visualization::Member.new(id:vis_id).fetch
      vis.privacy = CartoDB::Visualization::Member::PRIVACY_PRIVATE
      vis.store

      login_host(user_b, org)

      get CartoDB.url(self, 'public_table', {id: vis.name}, user_a)
      last_response.status.should be(404)

      ['public_visualizations_public_map', 'public_tables_embed_map'].each { |forbidden_endpoint|
        get CartoDB.url(self, forbidden_endpoint, {id: vis.name}, user_a)
        follow_redirects
        last_response.status.should be(403), "#{forbidden_endpoint} is #{last_response.status}"
      }

      perm = vis.permission
      perm.set_user_permission(user_b, CartoDB::Permission::ACCESS_READONLY)
      perm.save

      get CartoDB.url(self, 'public_table', {id: vis.name}, user_a)
      last_response.status.should == 302
      # First we'll get redirected to the public map url
      follow_redirect!
      # Now url will get rewritten to current user
      last_response.status.should == 302
      url = CartoDB.base_url(org.name, user_b.username) +
        CartoDB.path(self, 'public_visualizations_show', {id: "#{user_a.username}.#{vis.name}"}) + "?redirected=true"
      last_response.location.should eq url

      ['public_visualizations_public_map', 'public_tables_embed_map'].each { |forbidden_endpoint|
        get CartoDB.url(self, forbidden_endpoint, {id: vis.name}, user_a)
        follow_redirects
        last_response.status.should be(200), "#{forbidden_endpoint} is #{last_response.status}"
        last_response.length.should >= 100
      }
      org.destroy
    end
  end

  def login_host(user, org)
    login_as(user, scope: user.username)
    host! "#{org.name}.localhost.lan"
  end

  def follow_redirects(limit = 10)
    while last_response.status == 302 && (limit -= 1) > 0 do
        follow_redirect!
    end
  end

  def factory(owner=nil)
    owner = @user if owner.nil?
    map     = Map.create(user_id: owner.id)
    payload = {
      name:         "visualization #{rand(9999)}",
      tags:         ['foo', 'bar'],
      map_id:       map.id,
      description:  'bogus',
      type:         'derived'
    }

    with_host "#{owner.username}.localhost.lan" do
      post "/api/v1/viz?api_key=#{owner.api_key}", payload.to_json
    end


    JSON.parse(last_response.body)
  end

  def table_factory(attrs = {})
    new_table(attrs.merge(user_id: @user.id)).save.reload
  end

end # Admin::VisualizationsController
