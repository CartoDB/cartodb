require_relative '../spec_helper'
require 'helpers/subdomainless_helper'
include Warden::Test::Helpers
include Carto::Factories::Visualizations

def login(user)
  login_as(user, scope: user.username)
  domain = user.organization ? user.organization.name : user.username
  base_url = CartoDB.subdomainless_urls? ? "localhost.lan" : "#{domain}.localhost.lan"
  host! base_url
end

def follow_redirects(limit = 10)
  while response.redirect? && (limit -= 1) > 0
    follow_redirect!
  end
end

describe "UserState" do

  before(:all) do
    @organization = create_organization_with_owner
    @org_account_type = create_account_type_fg('ORGANIZATION USER')
    @locked_user = create(:locked_user)
    @map, @table, @table_visualization, @visualization = create_full_builder_vis(@locked_user)
    @visualization.create_mapcap!
    @non_locked_user = create(:valid_user)
    @unverified_user = create(:unverified_user)
    @public_user_endpoints = ['/me'].freeze
    @user_endpoints = ['/account', '/profile'].freeze
    @dashboard_endpoints = ['/dashboard', '/dashboard/tables', '/dashboard/datasets', '/dashboard/visualizations',
                            '/dashboard/maps'].freeze
    @tables_endpoints = ["/tables/#{@table.id}", "/tables/#{@table.id}/public", "/tables/#{@table.id}/embed_map"].freeze
    @viz_endpoints = ["/viz/#{@visualization.id}/public",
                      "/viz/#{@visualization.id}/embed_map", "/viz/#{@visualization.id}/public_map",
                      "/builder/#{@visualization.id}", "/builder/#{@visualization.id}/embed"].freeze
    @admin_endpoints = @public_user_endpoints + @user_endpoints + @dashboard_endpoints + @tables_endpoints +
                       @viz_endpoints
    @public_api_viz_endpoints = ["/api/v1/viz", "/api/v1/viz/#{@visualization.id}",
                                 "/api/v2/viz/#{@visualization.id}/viz",
                                 "/api/v3/viz/#{@visualization.id}/viz"].freeze
    @public_api_me_endpoint = ["/api/v3/me"].freeze
    @public_api_endpoints = @public_api_viz_endpoints + @public_api_me_endpoint
    @private_api_endpoints = ["/api/v1/tables/#{@table.id}", "/api/v1/tables/#{@table.id}/columns",
                              "/api/v1/imports", "/api/v1/users/#{@locked_user.id}/layers",
                              "/api/v1/synchronizations", "/api/v1/geocodings",
                              "/api/v1/users/#{@locked_user.id}"]
    @headers = {}
    @api_headers = { 'CONTENT_TYPE' => 'application/json', :format => "json" }
    @maintenance_mode_user = create(:valid_user, maintenance_mode: true)
  end

  after(:all) do
    @locked_user.destroy
    @non_locked_user.destroy
    @maintenance_mode_user.destroy
    @unverified_user.destroy
  end

  context 'unverified user' do
    shared_examples 'unverified user' do
      it 'redirects to unverified for admin endpoints' do
        @admin_endpoints.each do |endpoint|
          login(@unverified_user)
          endpoint = "/user/#{@unverified_user.username}/#{endpoint}" unless host.include?(@unverified_user.username)

          get endpoint, {}, @headers

          response.status.should == 302
          follow_redirect!

          request.path.should include "unverified"
        end
      end

      it 'returns 403 for private api endpoints' do
        @private_api_endpoints.each do |endpoint|
          login(@unverified_user)
          endpoint = "/user/#{@unverified_user.username}/#{endpoint}" unless host.include?(@unverified_user.username)

          get "#{endpoint}?api_key=#{@unverified_user.api_key}", {}, @api_headers

          response.status.should == 403
        end
      end

      it 'returns 403 for public api viz endpoints' do
        @public_api_viz_endpoints.each do |endpoint|
          login(@unverified_user)
          endpoint = "/user/#{@unverified_user.username}/#{endpoint}" unless host.include?(@unverified_user.username)

          get endpoint, {}, @api_headers

          response.status.should == 403
        end
      end

      it 'returns 200 for public api me endpoint' do
        @public_api_me_endpoint.each do |endpoint|
          login(@unverified_user)

          get endpoint, {}, @api_headers

          request.path.should == endpoint
          response.status.should == 200
        end
      end
    end
  end

  context 'locked state' do
    shared_examples "locked user" do
      it 'redirects to lockout for admin endpoints' do
        @admin_endpoints.each do |endpoint|
          login(@locked_user)
          endpoint = "/user/#{@locked_user.username}/#{endpoint}" unless host.include?(@locked_user.username)

          get endpoint, {}, @headers

          response.status.should == 302
          follow_redirects

          request.path.should include '/lockout'
          response.status.should == 200
        end
      end

      it 'returns 403 for private api endpoints' do
        @private_api_endpoints.each do |endpoint|
          login(@locked_user)
          endpoint = "/user/#{@locked_user.username}/#{endpoint}" unless host.include?(@locked_user.username)

          get "#{endpoint}?api_key=#{@locked_user.api_key}", {}, @api_headers

          response.status.should == 403
        end
      end

      it 'returns 403 for public api viz endpoints' do
        @public_api_viz_endpoints.each do |endpoint|
          login(@locked_user)
          endpoint = "/user/#{@locked_user.username}/#{endpoint}" unless host.include?(@locked_user.username)

          get endpoint, {}, @api_headers

          response.status.should == 403
        end
      end

      it 'returns 200 for public api me endpoint' do
        @public_api_me_endpoint.each do |endpoint|
          login(@locked_user)

          get endpoint, {}, @api_headers

          request.path.should == endpoint
          response.status.should == 200
        end
      end
    end

    context 'with subdomainless' do
      before(:each) do
        stub_subdomainless
      end

      context 'organizational user' do
        before(:each) do
          @locked_user.organization = @organization
          @locked_user.account_type = @org_account_type
          @locked_user.save
        end

        after(:each) do
          @locked_user.organization = nil
          @locked_user.account_type = 'FREE'
          @locked_user.save
        end

        it_behaves_like 'locked user'
        it_behaves_like 'unverified user'
      end

      context 'regular user' do
        it_behaves_like 'locked user'
        it_behaves_like 'unverified user'
      end
    end

    context 'with domainful' do
      context 'organizational user' do
        before(:each) do
          stub_domainful(@organization.name)
        end

        before(:each) do
          @locked_user.organization = @organization
          @locked_user.account_type = @org_account_type
          @locked_user.save
        end

        after(:each) do
          @locked_user.organization = nil
          @locked_user.account_type = 'FREE'
          @locked_user.save
        end

        it_behaves_like 'locked user'
        it_behaves_like 'unverified user'
      end

      context 'unverified regular user' do
        before(:each) do
          stub_domainful(@unverified_user.username)
        end

        it_behaves_like 'unverified user'
      end

      context 'regular user' do
        before(:each) do
          stub_domainful(@locked_user.username)
        end

        it_behaves_like 'locked user'
        it_behaves_like 'unverified user'

        it 'user accessing a locked user resources' do
          login(@non_locked_user)
          host! "#{@locked_user.username}.localhost.lan"
          @user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @tables_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @viz_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_api_endpoints.each do |endpoint|
            get endpoint, {}, @api_headers
            request.path.should == endpoint
            response.status.should == if endpoint == "/api/v3/me"
                                        200
                                      else
                                        404
                                      end
          end
        end
        it 'non-logged user accessing a locked user resources' do
          host! "#{@locked_user.username}.localhost.lan"
          @public_user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @tables_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @viz_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_api_endpoints.each do |endpoint|
            get endpoint, {}, @api_headers
            request.path.should == endpoint
            response.status.should == if endpoint == "/api/v3/me"
                                        200
                                      else
                                        404
                                      end
          end
        end
      end
    end

    it 'locked user can delete their own account' do
      to_be_deleted_user = create(:locked_user)
      to_be_deleted_user.password = 'pwd123'
      to_be_deleted_user.password_confirmation = 'pwd123'
      to_be_deleted_user.save

      login(to_be_deleted_user)
      delete api_v3_users_delete_me_url, deletion_password_confirmation: 'pwd123'

      expect(User.find(id: to_be_deleted_user.id)).to be_nil
    end
  end

  context 'maintenance mode' do
    shared_examples "maintenance mode" do
      it 'redirects to maintenance_mode for admin endpoints' do
        @admin_endpoints.each do |endpoint|
          login(@maintenance_mode_user)
          endpoint = "/user/#{@maintenance_mode_user.username}/#{endpoint}" unless host.include?(@maintenance_mode_user.username)

          get endpoint, {}, @headers

          response.status.should == 302
          follow_redirects

          request.path.should include '/maintenance_mode'
          response.status.should == 200
        end
      end

      it 'returns 403 for private api endpoints' do
        @private_api_endpoints.each do |endpoint|
          login(@maintenance_mode_user)
          endpoint = "/user/#{@maintenance_mode_user.username}/#{endpoint}" unless host.include?(@maintenance_mode_user.username)

          get "#{endpoint}?api_key=#{@maintenance_mode_user.api_key}", {}, @api_headers

          response.status.should == 403
        end
      end

      it 'returns 403 for public api viz endpoints' do
        @public_api_viz_endpoints.each do |endpoint|
          login(@maintenance_mode_user)
          endpoint = "/user/#{@maintenance_mode_user.username}/#{endpoint}" unless host.include?(@maintenance_mode_user.username)

          get endpoint, {}, @api_headers

          response.status.should == 403
        end
      end
    end

    context 'with subdomainless' do
      before(:each) do
        stub_subdomainless
      end

      context 'organizational user' do
        before(:each) do
          @maintenance_mode_user.organization = @organization
          @maintenance_mode_user.account_type = @org_account_type
          @maintenance_mode_user.save
        end

        after(:each) do
          @maintenance_mode_user.organization = nil
          @maintenance_mode_user.account_type = 'FREE'
          @maintenance_mode_user.save
        end

        it_behaves_like 'maintenance mode'
      end

      context 'regular user' do
        it_behaves_like 'maintenance mode'
      end
    end

    context 'with domainful' do
      context 'organizational user' do
        before(:each) do
          stub_domainful(@organization.name)
        end

        before(:each) do
          @maintenance_mode_user.organization = @organization
          @maintenance_mode_user.account_type = @org_account_type
          @maintenance_mode_user.save
        end

        after(:each) do
          @maintenance_mode_user.organization = nil
          @maintenance_mode_user.account_type = 'FREE'
          @maintenance_mode_user.save
        end

        it_behaves_like 'maintenance mode'
      end

      context 'regular user' do
        before(:each) do
          stub_domainful(@maintenance_mode_user.username)
        end

        it_behaves_like 'maintenance mode'

        it 'returns 403 for public api me endpoint' do
          @public_api_me_endpoint.each do |endpoint|
            login(@maintenance_mode_user)

            get endpoint, {}, @api_headers

            request.path.should == endpoint
            response.status.should == 403
          end
        end

        it 'user accessing a maintenance mode user resources' do
          login(@non_locked_user)
          host! "#{@maintenance_mode_user.username}.localhost.lan"
          @user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @tables_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @viz_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_api_endpoints.each do |endpoint|
            get endpoint, {}, @api_headers
            request.path.should == endpoint
            response.status.should == 404
          end
        end
        it 'non-logged user accessing a maintenance mode user resources' do
          host! "#{@maintenance_mode_user.username}.localhost.lan"
          @public_user_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @tables_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @viz_endpoints.each do |endpoint|
            get endpoint, {}, @headers
            response.status.should == 404
          end
          @public_api_endpoints.each do |endpoint|
            get endpoint, {}, @api_headers
            request.path.should == endpoint
            response.status.should == 404
          end
        end
      end
    end

    it 'maintenance mode user cannot delete their own account' do
      to_be_deleted_user = create(:valid_user, maintenance_mode: true)
      to_be_deleted_user.password = 'pwd123'
      to_be_deleted_user.password_confirmation = 'pwd123'
      to_be_deleted_user.save

      login(to_be_deleted_user)
      delete api_v3_users_delete_me_url, deletion_password_confirmation: 'pwd123'

      expect(User.find(id: to_be_deleted_user.id)).to_not be_nil
    end
  end

  context 'active state' do
    before(:each) do
      @locked_user.state = 'active'
      @locked_user.save
    end

    after(:each) do
      @locked_user.state = 'locked'
      @locked_user.save
    end

    it 'lets the owner access their resources' do
      # we use this to avoid generating the static assets in CI
      Admin::UsersController.any_instance.stubs(:render)
      Admin::VisualizationsController.any_instance.stubs(:render)

      login(@locked_user)
      host! "#{@locked_user.username}.localhost.lan"
      @dashboard_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        request.path.should_not == '/lockout'
        response.status.should == 200
      end
      @private_api_endpoints.each do |endpoint|
        get "#{endpoint}?api_key=#{@locked_user.api_key}", {}, @api_headers
        request.path.should == endpoint
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path.should == endpoint
        response.status.should == 200
      end
    end

    it 'lets a non locked user access resources from an active user' do
      # we use this to avoid generating the static assets in CI
      Admin::VisualizationsController.any_instance.stubs(:render)

      login(@non_locked_user)
      @user_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_user_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        host! "#{@locked_user.username}.localhost.lan"
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path.should == endpoint
        response.status.should == 200
      end
    end

    it 'lets unauthenticated users access resources from an active user' do
      host! "#{@locked_user.username}.localhost.lan"
      @public_user_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @tables_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @viz_endpoints.each do |endpoint|
        get endpoint, {}, @headers
        follow_redirects
        response.status.should == 200
      end
      @public_api_endpoints.each do |endpoint|
        get endpoint, {}, @api_headers
        request.path.should == endpoint
        response.status.should == 200
      end
    end
  end
end
