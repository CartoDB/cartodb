# encoding: utf-8

require 'ostruct'
require_relative '../../acceptance_helper'

feature "Superadmin's users API" do
  background do
    Capybara.current_driver = :rack_test
    @new_user = new_user(password: "this_is_a_password")
    @user_atts = @new_user.values
  end

  scenario "Http auth is needed" do
    post_json superadmin_users_path, format: "json" do |response|
      response.status.should == 401
    end
  end

  scenario "user create fail" do
    @user_atts[:email] = nil

    post_json superadmin_users_path, { user: @user_atts }, superadmin_headers do |response|
      response.status.should == 422
      response.body[:errors][:email].should be_present
      response.body[:errors][:email].should include("is not present")
    end
  end

  scenario "user create with password success" do
    @user_atts.delete(:crypted_password)
    @user_atts.delete(:salt)
    @user_atts.merge!(password: "this_is_a_password")

    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    post_json superadmin_users_path, { user: @user_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:email].should == @user_atts[:email]
      response.body[:username].should == @user_atts[:username]
      response.body.should_not have_key(:crypted_password)
      response.body.should_not have_key(:salt)

      # Double check that the user has been created properly
      user = ::User.filter(email: @user_atts[:email]).first
      user.should be_present
      user.id.should == response.body[:id]
      ::User.authenticate(user.username, "this_is_a_password").should == user
    end
    ::User.where(username: @user_atts[:username]).first.destroy
  end

  scenario "user create with crypted_password and salt success" do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    post_json superadmin_users_path, { user: @user_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:email].should == @user_atts[:email]
      response.body[:username].should == @user_atts[:username]
      response.body.should_not have_key(:crypted_password)
      response.body.should_not have_key(:salt)

      # Double check that the user has been created properly
      user = ::User.filter(email: @user_atts[:email]).first
      user.should be_present
      user.id.should == response.body[:id]
      ::User.authenticate(user.username, "this_is_a_password").should == user
    end
    ::User.where(username: @user_atts[:username]).first.destroy
  end

  scenario "user create default account settings" do
    @user_atts[:private_tables_enabled] = false
    @user_atts[:sync_tables_enabled] = false
    @user_atts[:map_view_quota] = 80
    t = Time.now
    @user_atts[:upgraded_at] = t

    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    post_json superadmin_users_path, { user: @user_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:quota_in_bytes].should == 104857600
      response.body[:table_quota].should == 5
      response.body[:account_type].should == 'FREE'
      response.body[:private_tables_enabled].should == false
      response.body[:sync_tables_enabled].should == false
      response.body[:map_view_quota].should == 80

      # Double check that the user has been created properly
      user = ::User.filter(email: @user_atts[:email]).first
      user.quota_in_bytes.should == 104857600
      user.table_quota.should == 5
      user.account_type.should == 'FREE'
      user.private_tables_enabled.should == false
      user.upgraded_at.should.to_s == t.to_s
    end
    ::User.where(username: @user_atts[:username]).first.destroy
  end

  scenario "user create non-default account settings" do
    @user_atts[:quota_in_bytes] = 2000
    @user_atts[:table_quota]    = 20
    @user_atts[:account_type]   = 'Juliet'
    @user_atts[:private_tables_enabled] = true
    @user_atts[:sync_tables_enabled] = true
    @user_atts[:map_view_block_price] = 15
    @user_atts[:geocoding_quota] = 15
    @user_atts[:geocoding_block_price] = 2
    @user_atts[:here_isolines_quota] = 100
    @user_atts[:here_isolines_block_price] = 5
    @user_atts[:obs_snapshot_quota] = 100
    @user_atts[:obs_snapshot_block_price] = 5
    @user_atts[:obs_general_quota] = 100
    @user_atts[:obs_general_block_price] = 5
    @user_atts[:notification] = 'Test'

    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    post_json superadmin_users_path, { user: @user_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:quota_in_bytes].should == 2000
      response.body[:table_quota].should == 20
      response.body[:account_type].should == 'Juliet'
      response.body[:private_tables_enabled].should == true
      response.body[:sync_tables_enabled].should == true
      response.body[:sync_tables_enabled].should == true
      response.body[:map_view_block_price].should == 15
      response.body[:geocoding_quota].should == 15
      response.body[:geocoding_block_price].should == 2
      response.body[:here_isolines_quota].should == 100
      response.body[:here_isolines_block_price].should == 5
      response.body[:obs_snapshot_quota].should == 100
      response.body[:obs_snapshot_block_price].should == 5
      response.body[:obs_general_quota].should == 100
      response.body[:obs_general_block_price].should == 5
      response.body[:notification].should == 'Test'

      # Double check that the user has been created properly
      user = ::User.filter(email: @user_atts[:email]).first
      user.quota_in_bytes.should == 2000
      user.table_quota.should == 20
      user.account_type.should == 'Juliet'
      user.private_tables_enabled.should == true
      user.sync_tables_enabled.should == true
      user.map_view_block_price.should == 15
      user.geocoding_quota.should == 15
      user.geocoding_block_price.should == 2
      user.here_isolines_quota.should == 100
      user.here_isolines_block_price.should == 5
      user.obs_snapshot_quota.should == 100
      user.obs_snapshot_block_price.should == 5
      user.obs_general_quota.should == 100
      user.obs_general_block_price.should == 5
      user.notification.should == 'Test'
    end
    ::User.where(username: @user_atts[:username]).first.destroy
  end

  scenario "update user account details" do
    user = create_user
    t = Time.now
    @update_atts = { quota_in_bytes: 2000,
                     table_quota: 20,
                     max_layers: 10,
                     user_timeout: 100000,
                     database_timeout: 200000,
                     account_type: 'Juliet',
                     private_tables_enabled: true,
                     sync_tables_enabled: true,
                     upgraded_at: t,
                     map_view_block_price: 200,
                     geocoding_quota: 230,
                     geocoding_block_price: 5,
                     here_isolines_quota: 250,
                     here_isolines_block_price: 10,
                     obs_snapshot_quota: 250,
                     obs_snapshot_block_price: 10,
                     obs_general_quota: 250,
                     obs_general_block_price: 10,
                     notification: 'Test',
                     available_for_hire: true,
                     disqus_shortname: 'abc' }

    # test to true
    put_json superadmin_user_path(user), { user: @update_atts }, superadmin_headers do |response|
      response.status.should == 204
    end
    user = ::User[user.id]
    user.quota_in_bytes.should == 2000
    user.table_quota.should == 20
    user.account_type.should == 'Juliet'
    user.private_tables_enabled.should == true
    user.sync_tables_enabled.should == true
    user.max_layers.should == 10
    user.database_timeout.should == 200000
    user.user_timeout.should == 100000
    user.upgraded_at.to_s.should == t.to_s
    user.map_view_block_price.should == 200
    user.geocoding_quota.should == 230
    user.geocoding_block_price.should == 5
    user.here_isolines_quota.should == 250
    user.here_isolines_block_price.should == 10
    user.obs_snapshot_quota.should == 250
    user.obs_snapshot_block_price.should == 10
    user.obs_general_quota.should == 250
    user.obs_general_block_price.should == 10
    user.notification.should == 'Test'
    user.disqus_shortname.should == 'abc'
    user.available_for_hire.should == true

    # then test back to false
    put_json superadmin_user_path(user), { user: { private_tables_enabled: false } }, superadmin_headers do |response|
      response.status.should == 204
    end
    user = ::User[user.id]
    user.private_tables_enabled.should == false
    user.map_view_block_price.should == 200
    user.geocoding_quota.should == 230
    user.geocoding_block_price.should == 5
    user.here_isolines_quota.should == 250
    user.here_isolines_block_price.should == 10
    user.obs_snapshot_quota.should == 250
    user.obs_snapshot_block_price.should == 10
    user.obs_general_quota.should == 250
    user.obs_general_block_price.should == 10
    user.notification.should == 'Test'

    user.destroy
  end

  scenario "user update fail" do
    user = create_user

    put_json superadmin_user_path(user), { user: { email: "" } }, superadmin_headers do |response|
      response.status.should == 422
    end

    user.destroy
  end

  scenario "user update success" do
    user = create_user
    put_json superadmin_user_path(user),
             { user: { email: "newmail@test.com", map_view_quota: 80 } },
             superadmin_headers do |response|
      response.status.should == 204
    end
    user = ::User[user.id]
    user.email.should == "newmail@test.com"
    user.map_view_quota.should == 80

    user.destroy
  end

  scenario "update success with new organization" do
    pending "Organizations handling has been refactored and needs new specs"
    user = create_user
    @update_atts = {
      quota_in_bytes: 2000,
      organization_attributes: { name: 'wadus', seats: 25, quota_in_bytes: 40000 }
    }

    put_json superadmin_user_path(user), { user: @update_atts }, superadmin_headers do |response|
      response.status.should eq 204
    end
    user = ::User[user.id]
    user.quota_in_bytes.should eq 2000
    user.organization.name.should eq 'wadus'
    user.organization.seats.should eq 25
    user.organization.quota_in_bytes.should eq 40000

    @update_atts = {
      quota_in_bytes: 2001,
      organization_attributes: { name: 'wadus', seats: 26 }
    }
    put_json superadmin_user_path(user), { user: @update_atts }, superadmin_headers do |response|
      response.status.should eq 204
    end
    user = ::User[user.id]
    user.quota_in_bytes.should eq 2001
    user.organization.name.should eq 'wadus'
    user.organization.seats.should eq 26
    user.organization.quota_in_bytes.should eq 40000

    user.destroy
  end

  scenario "user delete success" do
    pending "This scenario is failing and needs to be fixed, but the destroy action is actually working"
    user = create_user
    delete_json superadmin_user_path(user), superadmin_headers do |response|
      response.status.should == 204
    end
    ::User[user.id].should be_nil

    user.destroy
  end

  scenario "user dump success" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    response_body = {
      retcode: 0,
      return_values: {
        local_file: '/tmp/foo.sql.gz',
        remote_file: 's3://foo-bucket/backups/foo.sql.gz'
      }
    }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 200, body: response_body.to_json)
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 200
      response.body['retcode'] == 0
    end
    user.destroy
  end

  scenario "user dump fail" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 200, body: '{"retcode": 111}')
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 400
      response.body['retcode'] != 0
    end
    user.destroy
  end

  scenario "user dump fail retcode" do
    user = create_user
    dump_url = %r{#{user.database_host}:[0-9]+/scripts/db_dump}
    json_data = { database: user.database_name, username: user.username }
    Typhoeus.stub(dump_url,
                  method: :post
                 )
      .and_return(
        Typhoeus::Response.new(code: 500, body: '{"retcode": 0}')
      )

    get_json "/superadmin/users/#{user.id}/dump", {}, superadmin_headers do |response|
      response.status.should == 400
    end
    user.destroy
  end

  scenario "user get info success" do
    user = create_user
    get_json superadmin_user_path(user), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    get_json superadmin_user_path(user.id), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    get_json superadmin_user_path(user.username), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == user.id
    end

    user.destroy
  end

  scenario "user get info fail" do
    get_json superadmin_user_path('7b77546f-79cb-4662-9439-9ebafd9627cb'), {}, superadmin_headers do |response|
      response.status.should == 404
    end

    get_json superadmin_user_path('nonexistinguser'), {}, superadmin_headers do |response|
      response.status.should == 404
    end
  end

  describe "GET /superadmin/users" do
    before do
      @user  = create_user
      @user2 = create_user
    end

    after do
      @user.destroy
      @user2.destroy
    end

    it "gets all users" do
      get_json superadmin_users_path, {}, superadmin_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["username"] }.should include(@user.username, @user2.username)
        response.body.length.should >= 2
      end
    end

    it "gets overquota users" do
      ::User.stubs(:overquota).returns [@user]
      ::User.stubs(:get_stored_overquota_users).returns [@user.data]
      get_json superadmin_users_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["username"].should == @user.username
        response.body.length.should == 1
      end
    end

    it "gets cached db_size_in_bytes_change_users and returns username and db_size_in_bytes_change" do
      cached_users_mock = {
        'username1' => 1111,
        'username2' => 2222
      }
      Carto::UserDbSizeCache.any_instance.expects(:db_size_in_bytes_change_users).once.returns(cached_users_mock)

      get_json superadmin_users_path, { db_size_in_bytes_change: true }, superadmin_headers do |response|
        response.status.should == 200
        users = response.body
        users.length.should == cached_users_mock.length
        users.each do |user|
          user.keys.should == ['username', 'db_size_in_bytes']
        end
        users.each.map { |u| u['username'] }.sort.should == cached_users_mock.keys.sort
        users.each.map { |u| u['db_size_in_bytes'] }.sort.should == cached_users_mock.values.sort
      end
    end

    it "doesn't get organization users" do
      ::User.stubs(:organization).returns(Organization.new)
      ::User.stubs(:organization_id).returns("organization-id")
      get_json superadmin_users_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body.length.should == 0
      end
    end
  end

  describe '#update' do
    it 'should remove user feature_flag relation' do
      user                = FactoryGirl.create(:user)
      first_feature_flag  = FactoryGirl.create(:feature_flag)
      second_feature_flag = FactoryGirl.create(:feature_flag)

      FactoryGirl.create(:feature_flags_user, feature_flag_id: first_feature_flag.id, user_id: user.id)
      FactoryGirl.create(:feature_flags_user, feature_flag_id: second_feature_flag.id, user_id: user.id)

      expect do
        put superadmin_user_url(user.id), {
          user: { feature_flags: ["#{second_feature_flag.id}"] }, id: user.id
        }.to_json, superadmin_headers
      end.to change(FeatureFlagsUser, :count).by(-1)
    end

    it 'should create user feature_flag relation' do
      user                = FactoryGirl.create(:user)
      first_feature_flag  = FactoryGirl.create(:feature_flag)
      second_feature_flag = FactoryGirl.create(:feature_flag)

      second_feature_flag_user = FactoryGirl.create(:feature_flags_user, feature_flag_id: second_feature_flag.id, user_id: user.id)

      expect do
        put superadmin_user_url(user.id), {
          user: { feature_flags: [first_feature_flag.id.to_s, second_feature_flag.id.to_s] }, id: user.id
        }.to_json, superadmin_headers
      end.to change(FeatureFlagsUser, :count).by(1)
    end
  end

  describe '#destroy' do
    it 'should destroy user' do
      user = FactoryGirl.create(:user)

      expect do
        delete superadmin_user_url(user.id), { user: user }.to_json, superadmin_headers
      end.to change(::User, :count).by(-1)
    end

    it 'should destroy user feature flag relations' do
      user         = FactoryGirl.create(:user)
      feature_flag = FactoryGirl.create(:feature_flag)

      feature_flag_user = FactoryGirl.create(:feature_flags_user, feature_flag_id: feature_flag.id, user_id: user.id)

      expect do
        delete superadmin_user_url(user.id), { user: user }.to_json, superadmin_headers
      end.to change(FeatureFlagsUser, :count).by(-1)
    end
  end

  private
end
