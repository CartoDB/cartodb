require 'sequel'
require 'rack/test'
require 'json'
require_relative '../../spec_helper'
require_relative '../../support/factories/organizations'
require_relative '../../../app/controllers/admin/visualizations_controller'
require 'helpers/unique_names_helper'

def app
  CartoDB::Application.new
end #app

describe Admin::VisualizationsController do
  include UniqueNamesHelper
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CacheHelper
  include Carto::Factories::Visualizations

  # Mock for a Rails context
  class ContextMock
    def initialize(global_context)
      @global_context = global_context
    end

    def request
      nil
    end

    def polymorphic_path(*args)
      @global_context.polymorphic_path(*args)
    end
  end

  before(:all) do
    @user = FactoryGirl.create(:valid_user, private_tables_enabled: true)

    @api_key = @user.api_key
    @user.stubs(:should_load_common_data?).returns(false)

    @headers = {
      'CONTENT_TYPE'  => 'application/json',
    }
    @mock_context = ContextMock.new(self)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user
    host! "#{@user.username}.localhost.lan"
  end

  describe 'GET /viz' do
    it 'returns a list of visualizations' do
      # we use this to avoid generating the static assets in CI
      Admin::VisualizationsController.any_instance.stubs(:render).returns('')
      login_as(@user, scope: @user.username)

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
      login_as(@user, scope: @user.username)

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

    describe 'redirects to builder' do
      describe 'for tables' do
        before(:each) do
          @id = table_factory.id
        end
        it 'if forced' do
          @user.stubs(:builder_enabled).returns(true)
          @user.stubs(:builder_enabled?).returns(true)

          login_as(@user, scope: @user.username)
          get "/tables/#{@id}", {}, @headers
          last_response.status.should eq 302
          follow_redirect!
          last_request.path.should =~ %r{/dataset/}
        end

        it 'only if enabled' do
          @user.stubs(:builder_enabled).returns(true)
          @user.stubs(:builder_enabled?).returns(false)

          login_as(@user, scope: @user.username)
          get "/tables/#{@id}", {}, @headers
          last_response.status.should eq 200
        end

        it 'only if forced' do
          @user.stubs(:builder_enabled).returns(nil)
          @user.stubs(:builder_enabled?).returns(false)

          login_as(@user, scope: @user.username)
          get "/tables/#{@id}", {}, @headers
          last_response.status.should eq 200
        end
      end

      describe 'for visualizations' do
        before(:each) do
          @id = factory.fetch('id')
        end
        it 'if forced' do
          @user.stubs(:builder_enabled).returns(true)
          @user.stubs(:builder_enabled?).returns(true)

          login_as(@user, scope: @user.username)
          get "/viz/#{@id}", {}, @headers
          last_response.status.should eq 302
          follow_redirect!
          last_request.path.should =~ %r{/builder/}
        end

        it 'only if enabled' do
          @user.stubs(:builder_enabled).returns(true)
          @user.stubs(:builder_enabled?).returns(false)

          login_as(@user, scope: @user.username)
          get "/viz/#{@id}", {}, @headers
          last_response.status.should eq 200
        end

        it 'only if forced' do
          @user.stubs(:builder_enabled).returns(nil)
          @user.stubs(:builder_enabled?).returns(false)

          login_as(@user, scope: @user.username)
          get "/viz/#{@id}", {}, @headers
          last_response.status.should eq 200
        end

        it 'never for vizjson2 visualizations' do
          @user.stubs(:builder_enabled).returns(true)
          @user.stubs(:builder_enabled?).returns(true)
          Carto::Visualization::any_instance.stubs(:uses_vizjson2?).returns(true)

          login_as(@user, scope: @user.username)
          get public_visualizations_show_path(id: @id), {}, @headers
          last_response.status.should eq 200
        end

        it 'embed redirects to builder for v3 when needed' do
          # These two tests are in the same testcase to test proper embed cache invalidation
          @user.stubs(:builder_enabled).returns(false)
          @user.stubs(:builder_enabled?).returns(false)
          visualization = CartoDB::Visualization::Member.new(id: @id).fetch
          visualization.version = 2
          visualization.store

          login_as(@user, scope: @user.username)
          get public_visualizations_embed_map_path(id: @id), {}, @headers
          last_response.status.should eq 200

          visualization.version = 3
          visualization.store

          login_as(@user, scope: @user.username)
          get public_visualizations_embed_map_path(id: @id), {}, @headers
          last_response.status.should eq 302
        end
      end
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

    it 'go to password protected page if the viz is password protected' do
      id = factory.fetch('id')
      visualization = CartoDB::Visualization::Member.new(id: id).fetch
      visualization.version = 2
      visualization.password = 'foobar'
      visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      visualization.store

      get "/viz/#{id}/public_map", {}, @headers
      last_response.status.should == 200
      last_response.body.scan(/Insert your password/).present?.should == true
    end

    it 'returns proper surrogate-keys' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get "/viz/#{id}/public_map", {}, @headers
      last_response.status.should == 200
      last_response.headers["Surrogate-Key"].should_not be_empty
      last_response.headers["Surrogate-Key"].should include(CartoDB::SURROGATE_NAMESPACE_PUBLIC_PAGES)
    end

    it 'returns public map for org users' do
      org = OrganizationFactory.new.new_organization.save

      user_a = create_user(quota_in_bytes: 123456789, table_quota: 400)
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin

      vis_id = new_table({user_id: user_a.id, privacy: ::UserTable::PRIVACY_PUBLIC}).save.reload.table_visualization.id

      host! "#{org.name}.localhost.lan"
      get "/viz/#{vis_id}/public_map", @headers
      last_response.status.should == 200
    end

    it 'go to password protected page if the organization viz is password protected' do
      org = OrganizationFactory.new.new_organization.save

      user_a = create_user(quota_in_bytes: 123456789, table_quota: 400)
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin
      id = factory(owner=user_a).fetch('id')
      visualization = CartoDB::Visualization::Member.new(id: id).fetch
      visualization.version = 2
      visualization.password = 'foobar'
      visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      visualization.store

      get "/viz/#{id}/public_map", {}, @headers

      last_response.status.should == 302
      follow_redirect!
      last_response.status.should == 200
      last_response.body.scan(/Insert your password/).present?.should == true
    end

    it 'does not load daily mapviews stats' do
      CartoDB::Visualization::Stats.expects(:mapviews).never
      CartoDB::Visualization::Stats.any_instance.expects(:to_poro).never
      CartoDB::Visualization.expects(:stats).never
      Carto::Visualization.expects(:stats).never

      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get public_visualizations_public_map_url(id: id), {}, @headers
      last_response.status.should == 200
    end

    it 'serves X-Frame-Options: DENY' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get "/viz/#{id}/public_map", {}, @headers
      last_response.status.should == 200
      last_response.headers['X-Frame-Options'].should == 'DENY'
    end
  end

  describe 'public_visualizations_show_map' do

    it 'does not load daily mapviews stats' do
      CartoDB::Visualization::Stats.expects(:mapviews).never
      CartoDB::Visualization::Stats.any_instance.expects(:to_poro).never
      CartoDB::Stats::APICalls.any_instance.expects(:get_api_calls_from_redis_source).never

      CartoDB::Visualization.expects(:stats).never
      Carto::Visualization.expects(:stats).never

      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      login_as(@user, scope: @user.username)
      get public_visualizations_show_map_url(id: id), {}, @headers
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
    end

    it "redirects to embed_map if visualization is 'derived'" do
      map = FactoryGirl.create(:map, user_id: @user.id)
      derived_visualization = FactoryGirl.create(:derived_visualization, user_id: @user.id, map_id: map.id)
      id = derived_visualization.id

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

      login_as(@user, scope: @user.username)

      get "/viz/#{name}/embed_map", {}, @headers
      last_response.status.should == 403
      last_response.body.should include("Map or dataset not found, or with restricted access.")
    end

    it 'renders embed map error when an exception is raised' do
      login_as(@user, scope: @user.username)

      get "/viz/220d2f46-b371-11e4-93f7-080027880ca6/embed_map", {}, @headers
      last_response.status.should == 404
    end

    it 'doesnt serve X-Frame-Options: DENY on embedded with name' do
      table = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC)
      name = table.table_visualization.name

      get "/viz/#{URI::encode(name)}/embed_map", {}, @headers
      last_response.status.should == 200
      last_response.headers.include?('X-Frame-Options').should_not == true
    end
  end

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

    it 'doesnt serve X-Frame-Options: DENY on embedded' do
      id = table_factory(privacy: ::UserTable::PRIVACY_PUBLIC).table_visualization.id

      get "/viz/#{id}/embed_map", {}, @headers
      last_response.status.should == 200
      last_response.headers.include?('X-Frame-Options').should_not == true
    end
  end

  describe 'GET /viz/:name/track_embed' do
    it 'renders the view by passing a visualization name' do
      login_as(@user, scope: @user.username)

      get "/viz/track_embed", {}, @headers
      last_response.status.should == 200
    end

    it 'doesnt serve X-Frame-Options: DENY for track_embed' do
      login_as(@user, scope: @user.username)

      get "/viz/track_embed", {}, @headers
      last_response.status.should == 200
      last_response.headers.include?('X-Frame-Options').should_not == true
    end
  end

  describe 'non existent visualization' do
    it 'returns 404' do
      login_as(@user, scope: @user.username)

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
      Carto::ApiKey.any_instance.stubs(:save_cdb_conf_info)
      CartoDB::UserModule::DBService.any_instance.stubs(:move_to_own_schema).returns(nil)
      CartoDB::TablePrivacyManager.any_instance.stubs(
          :set_from_table_privacy => nil,
          :propagate_to_varnish => nil
      )

      ::User.any_instance.stubs(
        after_create: nil
      )

      CartoDB::UserModule::DBService.any_instance.stubs(
        grant_user_in_database: nil,
        grant_publicuser_in_database: nil,
        set_user_privileges_at_db: nil,
        set_statement_timeouts: nil,
        set_user_as_organization_member: nil,
        rebuild_quota_trigger: nil,
        setup_organization_user_schema: nil,
        set_database_search_path: nil,
        cartodb_extension_version_pre_mu?: false,
        load_cartodb_functions: nil,
        create_schema: nil,
        move_tables_to_schema: nil,
        create_public_db_user: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)

      Table.any_instance.stubs(perform_cartodb_function: nil,
                               update_cdb_tablemetadata: nil,
                               update_table_pg_stats: nil,
                               create_table_in_database!: nil,
                               get_table_id: 1,
                               grant_select_to_tiler_user: nil,
                               cartodbfy: nil,
                               set_the_geom_column!: nil)

      # --------TEST ITSELF-----------

      org = Organization.new
      org.name = 'vis-spec-org-2'
      org.quota_in_bytes = 1024 ** 3
      org.seats = 10
      org.builder_enabled = false
      org.save

      ::User.any_instance.stubs(:remaining_quota).returns(1000)
      user_a = create_user(username: 'user-a', quota_in_bytes: 123456789, table_quota: 400)
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin
      org.reload
      user_a.reload

      user_b = create_user(username: 'user-b',
                           quota_in_bytes: 123456789,
                           table_quota: 400,
                           organization: org,
                           account_type: 'ORGANIZATION USER')

      # Needed because after_create is stubbed
      user_a.create_api_keys
      user_b.create_api_keys

      vis_id = factory(user_a).fetch('id')
      vis = CartoDB::Visualization::Member.new(id: vis_id).fetch
      vis.privacy = CartoDB::Visualization::Member::PRIVACY_PRIVATE
      vis.store

      login_host(user_b, org)

      get CartoDB.url(@mock_context, 'public_table', params: { id: vis.name }, user: user_a)
      last_response.status.should be(404)

      ['public_visualizations_public_map', 'public_tables_embed_map'].each do |forbidden_endpoint|
        get CartoDB.url(@mock_context, forbidden_endpoint, params: { id: vis.name }, user: user_a)
        follow_redirects
        last_response.status.should be(403), "#{forbidden_endpoint} is #{last_response.status}"
      end

      perm = vis.permission
      perm.set_user_permission(user_b, CartoDB::Permission::ACCESS_READONLY)
      perm.save

      get CartoDB.url(@mock_context, 'public_table', params: { id: vis.name }, user: user_a)
      last_response.status.should == 302
      # First we'll get redirected to the public map url
      follow_redirect!
      # Now url will get rewritten to current user
      last_response.status.should == 302
      url = CartoDB.base_url(org.name, user_b.username) +
            CartoDB.path(self, 'public_visualizations_show', id: "#{user_a.username}.#{vis.name}") + "?redirected=true"
      last_response.location.should eq url

      ['public_visualizations_public_map', 'public_tables_embed_map'].each do |forbidden_endpoint|
        get CartoDB.url(@mock_context, forbidden_endpoint, params: { id: vis.name }, user: user_a)
        follow_redirects
        last_response.status.should be(200), "#{forbidden_endpoint} is #{last_response.status}"
        last_response.length.should >= 100
      end
      org.destroy
    end

    # @see https://github.com/CartoDB/cartodb/issues/6081
    it 'If logged user navigates to legacy url from org user without org name, gets redirected properly' do
      Carto::ApiKey.any_instance.stubs(:save_cdb_conf_info)
      CartoDB::UserModule::DBService.any_instance.stubs(:move_to_own_schema).returns(nil)
      CartoDB::TablePrivacyManager.any_instance.stubs(
        set_from_table_privacy: nil,
        propagate_to_varnish: nil
      )

      ::User.any_instance.stubs(
        after_create: nil
      )

      CartoDB::UserModule::DBService.any_instance.stubs(
        grant_user_in_database: nil,
        grant_publicuser_in_database: nil,
        set_user_privileges_at_db: nil,
        set_statement_timeouts: nil,
        set_user_as_organization_member: nil,
        rebuild_quota_trigger: nil,
        setup_organization_user_schema: nil,
        set_database_search_path: nil,
        cartodb_extension_version_pre_mu?: false,
        load_cartodb_functions: nil,
        create_schema: nil,
        move_tables_to_schema: nil,
        create_public_db_user: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      Carto::NamedMaps::Api.any_instance.stubs(get: nil, create: true, update: true)
      Table.any_instance.stubs(
        perform_cartodb_function: nil,
        update_cdb_tablemetadata: nil,
        update_table_pg_stats: nil,
        create_table_in_database!: nil,
        get_table_id: 1,
        grant_select_to_tiler_user: nil,
        cartodbfy: nil,
        set_the_geom_column!: nil
      )

      # --------TEST ITSELF-----------

      org = Organization.new
      org.name = 'vis-spec-org'
      org.quota_in_bytes = 1024**3
      org.seats = 10
      org.builder_enabled = false
      org.save

      ::User.any_instance.stubs(:remaining_quota).returns(1000)
      user_a = create_user(quota_in_bytes: 123456789, table_quota: 400)
      user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
      user_org.promote_user_to_admin
      org.reload
      user_a.reload

      user_b = create_user(quota_in_bytes: 123456789, table_quota: 400)

      # Needed because after_create is stubbed
      user_a.create_api_keys
      user_b.create_api_keys

      vis_id = factory(user_a).fetch('id')
      vis = CartoDB::Visualization::Member.new(id: vis_id).fetch
      vis.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC
      vis.store

      login_host(user_b)

      # dirty but effective trick, generate the url as if were for a non-org user, then replace usernames
      # to respect format and just have no organization
      destination_url = CartoDB.url(@mock_context, 'public_visualizations_public_map',
                                    params: { id: vis.name }, user: user_b)
                               .sub(user_b.username, user_a.username)

      get destination_url
      last_response.status.should be(302)
      last_response.headers["Location"].should eq CartoDB.url(@mock_context, 'public_visualizations_public_map',
                                                              params: { id: vis.id, redirected: true }, user: user_a)
      follow_redirect!
      last_response.status.should be(200)

      org.destroy
    end
  end

  describe 'find visualizations by name' do
    before(:all) do
      @organization = create_organization_with_users(name: unique_name('organization'))
      @org_user = @organization.users.first
      bypass_named_maps
      @table = new_table(user_id: @org_user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload
      @faketable = new_table(user_id: @user.id, privacy: ::UserTable::PRIVACY_PUBLIC).save.reload
      @faketable_name = @faketable.table_visualization.name
    end

    it 'finds visualization by org and name' do
      url = CartoDB.url(@mock_context, 'public_table', params: { id: @table.table_visualization.name }, user: @org_user)
      url = url.sub("/u/#{@org_user.username}", '')

      get url
      last_response.status.should == 200
    end

    it 'does not find visualizations outside org' do
      url = CartoDB.url(@mock_context, 'public_table', params: { id: @faketable_name }, user: @org_user)
      url = url.sub("/u/#{@org_user.username}", '')

      get url
      last_response.status.should == 404
    end

    it 'finds visualization by user and public.name' do
      url = CartoDB.url(@mock_context, 'public_table',
                        params: { id: "public.#{@table.table_visualization.name}" }, user: @org_user)

      get url
      last_response.status.should == 200
    end

    it 'finds visualization by user and public.id' do
      url = CartoDB.url(@mock_context, 'public_table',
                        params: { id: "public.#{@table.table_visualization.id}" }, user: @org_user)

      get url
      last_response.status.should == 200
    end

    it 'does not find visualizations outside user with public schema' do
      url = CartoDB.url(@mock_context, 'public_table',
                        params: { id: "public.#{@faketable_name}" }, user: @org_user)
      url = url.sub("/u/#{@org_user.username}", '')

      get url
      last_response.status.should == 404
    end

    it 'does not try to search visualizations with invalid user/org' do
      url = CartoDB.url(@mock_context, 'public_table', params: { id: "public.#{@table.name}" }, user: @org_user)
      url = url.sub("/u/#{@org_user.username}", '/u/invalidus3r')

      get url
      last_response.status.should == 404
    end
  end

  def login_host(user, org = nil)
    login_as(user, scope: user.username)
    host! "#{org.nil? ? user.username : org.name}.localhost.lan"
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
      name:         unique_name('viz'),
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
