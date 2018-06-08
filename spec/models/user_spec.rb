# coding: utf-8

require 'ostruct'
require_relative '../spec_helper'
require_relative 'user_shared_examples'
require_relative '../../services/dataservices-metrics/lib/isolines_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/observatory_snapshot_usage_metrics'
require_relative '../../services/dataservices-metrics/lib/observatory_general_usage_metrics'
require 'factories/organizations_contexts'
require_relative '../../app/model_factories/layer_factory'
require_dependency 'cartodb/redis_vizjson_cache'
require 'helpers/rate_limits_helper'
require 'helpers/unique_names_helper'
require 'helpers/account_types_helper'
require 'factories/users_helper'
require 'factories/database_configuration_contexts'

describe 'refactored behaviour' do
  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).get_twitter_imports_count
    end

    def get_user_by_id(user_id)
      ::User.where(id: user_id).first
    end

    def create_user
      FactoryGirl.create(:valid_user)
    end
  end
end

describe User do
  include UniqueNamesHelper
  include AccountTypesHelper
  include RateLimitsHelper

  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  before(:all) do
    bypass_named_maps

    @user_password = 'admin123'
    puts "\n[rspec][user_spec] Creating test user databases..."
    @user     = create_user :email => 'admin@example.com', :username => 'admin', :password => @user_password
    @user2    = create_user :email => 'user@example.com',  :username => 'user',  :password => 'user123'

    puts "[rspec][user_spec] Loading user data..."
    reload_user_data(@user) && @user.reload

    puts "[rspec][user_spec] Running..."
  end

  before(:each) do
    bypass_named_maps
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    Table.any_instance.stubs(:update_cdb_tablemetadata)
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
    @user2.destroy
    @account_type.destroy if @account_type
    @account_type_org.destroy if @account_type_org
  end

  it "should only allow legal usernames" do
    illegal_usernames = %w(si$mon 'sergio estella' j@vi sergio£££ simon_tokumine SIMON Simon jose.rilla -rilla rilla-)
    legal_usernames   = %w(simon javier-de-la-torre sergio-leiva sergio99)

    illegal_usernames.each do |name|
      @user.username = name
      @user.valid?.should be_false
      @user.errors[:username].should be_present
    end

    legal_usernames.each do |name|
      @user.username = name
      @user.valid?.should be_true
      @user.errors[:username].should be_blank
    end
  end

  it "should not allow a username in use by an organization" do
    org = create_org('testusername', 10.megabytes, 1)
    @user.username = org.name
    @user.valid?.should be_false
    @user.username = 'wadus'
    @user.valid?.should be_true
  end

  describe 'organization checks' do
    it "should not be valid if his organization doesn't have more seats" do
      organization = create_org('testorg', 10.megabytes, 1)
      user1 = create_user email: 'user1@testorg.com',
                          username: 'user1',
                          password: 'user11',
                          account_type: 'ORGANIZATION USER'
      user1.organization = organization
      user1.save
      organization.owner_id = user1.id
      organization.save
      organization.reload
      user1.reload

      user2 = new_user
      user2.organization = organization
      user2.valid?.should be_false
      user2.errors.keys.should include(:organization)

      organization.destroy
      user1.destroy
    end

    it 'should be valid if his organization has enough seats' do
      organization = create_org('testorg', 10.megabytes, 1)
      user = ::User.new
      user.organization = organization
      user.valid?
      user.errors.keys.should_not include(:organization)
      organization.destroy
    end

    it "should not be valid if his organization doesn't have enough disk space" do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(10.megabytes)
      user = ::User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?.should be_false
      user.errors.keys.should include(:quota_in_bytes)
      organization.destroy
    end

    it 'should be valid if his organization has enough disk space' do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(9.megabytes)
      user = ::User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?
      user.errors.keys.should_not include(:quota_in_bytes)
      organization.destroy
    end

    describe '#org_admin' do
      before(:all) do
        @organization = create_organization_with_owner
      end

      after(:all) do
        @organization.destroy
      end

      def create_role(user)
        # NOTE: It's hard to test the real Groups API call here, it needs a Rails server up and running
        # Instead, we test the main step that this function does internally (creating a role)
        user.in_database["CREATE ROLE \"#{user.database_username}_#{unique_name('role')}\""].all
      end

      it 'cannot be owner and viewer at the same time' do
        @organization.owner.viewer = true
        @organization.owner.should_not be_valid
        @organization.owner.errors.keys.should include(:viewer)
      end

      it 'cannot be admin and viewer at the same time' do
        user = ::User.new
        user.organization = @organization
        user.viewer = true
        user.org_admin = true
        user.should_not be_valid
        user.errors.keys.should include(:viewer)
      end

      it 'should not be able to create groups without admin rights' do
        user = FactoryGirl.create(:valid_user, organization: @organization)
        expect { create_role(user) }.to raise_error
      end

      it 'should be able to create groups with admin rights' do
        user = FactoryGirl.create(:valid_user, organization: @organization, org_admin: true)
        expect { create_role(user) }.to_not raise_error
      end

      it 'should revoke admin rights on demotion' do
        user = FactoryGirl.create(:valid_user, organization: @organization, org_admin: true)
        expect { create_role(user) }.to_not raise_error

        user.org_admin = false
        user.save

        expect { create_role(user) }.to raise_error
      end
    end

    describe 'organization email whitelisting' do

      before(:each) do
        @organization = create_org('testorg', 10.megabytes, 1)
      end

      after(:each) do
        @organization.destroy
      end

      it 'valid_user is valid' do
        user = FactoryGirl.build(:valid_user)
        user.valid?.should == true
      end

      it 'user email is valid if organization has not whitelisted domains' do
        user = FactoryGirl.build(:valid_user, organization: @organization)
        user.valid?.should == true
      end

      it 'user email is not valid if organization has whitelisted domains and email is not under that domain' do
        @organization.whitelisted_email_domains = [ 'organization.org' ]
        user = FactoryGirl.build(:valid_user, organization: @organization)
        user.valid?.should eq false
        user.errors[:email].should_not be_nil
      end

      it 'user email is valid if organization has whitelisted domains and email is under that domain' do
        user = FactoryGirl.build(:valid_user, organization: @organization)
        @organization.whitelisted_email_domains = [ user.email.split('@')[1] ]
        user.valid?.should eq true
        user.errors[:email].should == []
      end
    end

    describe 'when updating user quota' do
      it 'should be valid if his organization has enough disk space' do
        organization = create_organization_with_users(quota_in_bytes: 70.megabytes)
        organization.assigned_quota.should == 70.megabytes
        user = organization.owner
        user.quota_in_bytes = 1.megabyte
        user.valid?
        user.errors.keys.should_not include(:quota_in_bytes)
        organization.destroy
      end
      it "should not be valid if his organization doesn't have enough disk space" do
        organization = create_organization_with_users(quota_in_bytes: 70.megabytes)
        organization.assigned_quota.should == 70.megabytes
        user = organization.owner
        user.quota_in_bytes = 71.megabytes
        user.valid?.should be_false
        user.errors.keys.should include(:quota_in_bytes)
        organization.destroy
      end
    end

    describe 'when updating viewer state' do
      before(:all) do
        @organization = create_organization_with_users(quota_in_bytes: 70.megabytes)
      end

      after(:all) do
        @organization.destroy
      end

      before(:each) do
        @organization.viewer_seats = 10
        @organization.seats = 10
        @organization.save
      end

      it 'should not allow changing to viewer without seats' do
        @organization.viewer_seats = 0
        @organization.save

        user = @organization.users.find { |u| !u.organization_owner? }
        user.reload
        user.viewer = true
        expect(user).not_to be_valid
        expect(user.errors.keys).to include(:organization)
      end

      it 'should allow changing to viewer with enough seats' do
        user = @organization.users.find { |u| !u.organization_owner? }
        user.reload
        user.viewer = true
        expect(user).to be_valid
        expect(user.errors.keys).not_to include(:organization)
      end

      it 'should not allow changing to builder without seats' do
        user = @organization.users.find { |u| !u.organization_owner? }
        user.reload
        user.viewer = true
        user.save

        @organization.seats = 1
        @organization.save

        user.reload
        user.viewer = false
        expect(user).not_to be_valid
        expect(user.errors.keys).to include(:organization)
      end

      it 'should allow changing to builder with seats' do
        user = @organization.users.find { |u| !u.organization_owner? }
        user.reload
        user.viewer = true
        user.save

        user.reload
        user.viewer = false
        expect(user).to be_valid
        expect(user.errors.keys).not_to include(:organization)
      end
    end

    it 'should set account_type properly' do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.account_type.should == "ORGANIZATION USER"
      end
      organization.destroy
    end

    it 'should set default settings properly unless overriden' do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.max_layers.should eq ::User::DEFAULT_MAX_LAYERS
        u.private_tables_enabled.should be_true
        u.sync_tables_enabled.should be_true
      end
      user = FactoryGirl.build(:user, organization: organization)
      user.max_layers = 3
      user.save
      user.max_layers.should == 3
      organization.destroy
    end

    describe 'google_maps_key and google_maps_private_key' do
      before(:all) do
        @organization = create_organization_with_users(google_maps_key: 'gmk', google_maps_private_key: 'gmpk')
        @organization.google_maps_key.should_not be_nil
        @organization.google_maps_private_key.should_not be_nil
      end

      after(:all) do
        @organization.destroy
      end

      it 'should be inherited from organization for new users' do
        @organization.users.should_not be_empty
        @organization.users.reject(&:organization_owner?).each do |u|
          u.google_maps_key.should == @organization.google_maps_key
          u.google_maps_private_key.should == @organization.google_maps_private_key
        end
      end
    end

    it 'should inherit twitter_datasource_enabled from organization on creation' do
      organization = create_organization_with_users(twitter_datasource_enabled: true)
      organization.save
      organization.twitter_datasource_enabled.should be_true
      organization.users.reject(&:organization_owner?).each do |u|
        u.twitter_datasource_enabled.should be_true
      end
      user = create_user(organization: organization)
      user.save
      user.twitter_datasource_enabled.should be_true
      organization.destroy
    end

    it "should return proper values for non-persisted settings" do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.private_maps_enabled.should be_true
      end
      organization.destroy
    end
  end

  describe 'central synchronization' do
    it 'should create remote user in central if needed' do
      pending "Central API credentials not provided" unless ::User.new.sync_data_with_cartodb_central?
      organization = create_org('testorg', 500.megabytes, 1)
      user = create_user email: 'user1@testorg.com',
                         username: 'user1',
                         password: 'user11',
                         account_type: 'ORGANIZATION USER'
      user.organization = organization
      user.save
      Cartodb::Central.any_instance.expects(:create_organization_user).with(organization.name, user.allowed_attributes_to_central(:create)).once
      user.create_in_central.should be_true
      organization.destroy
    end
  end

  it 'should store feature flags' do
    ff = FactoryGirl.create(:feature_flag, id: 10001, name: 'ff10001')

    user = create_user :email => 'ff@example.com', :username => 'ff-user-01', :password => 'ff-user-01'
    user.set_relationships_from_central({ feature_flags: [ ff.id.to_s ]})
    user.save
    user.feature_flags_user.map { |ffu| ffu.feature_flag_id }.should include(ff.id)
    user.destroy
  end

  it 'should delete feature flags assignations to a deleted user' do
    ff = FactoryGirl.create(:feature_flag, id: 10002, name: 'ff10002')

    user = create_user :email => 'ff2@example.com', :username => 'ff2-user-01', :password => 'ff2-user-01'
    user.set_relationships_from_central({ feature_flags: [ ff.id.to_s ]})
    user.save
    user_id = user.id
    user.destroy
    SequelRails.connection["select count(*) from feature_flags_users where user_id = '#{user_id}'"].first[:count].should eq 0
    SequelRails.connection["select count(*) from feature_flags where id = '#{ff.id}'"].first[:count].should eq 1
  end

  it "should have a default dashboard_viewed? false" do
    user = ::User.new
    user.dashboard_viewed?.should be_false
  end

  it "should reset dashboard_viewed when dashboard gets viewed" do
    user = ::User.new
    user.view_dashboard
    user.dashboard_viewed?.should be_true
  end

  it "should validate that password is present if record is new and crypted_password or salt are blank" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"

    user.valid?.should be_false
    user.errors[:password].should be_present

    another_user = new_user(user.values.merge(:password => "admin123"))
    user.crypted_password = another_user.crypted_password
    user.salt = another_user.salt
    user.valid?.should be_true
    user.save

    # Let's ensure that crypted_password and salt does not change
    user_check = ::User[user.id]
    user_check.crypted_password.should == another_user.crypted_password
    user_check.salt.should == another_user.salt

    user.password = nil
    user.valid?.should be_true

    user.destroy
  end

  it "should validate job_role and deprecated_job_roles" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"
    user.password = 'admin123'
    user.password_confirmation = 'admin123'

    user.job_role = "Developer"
    user.valid?.should be_true

    user.job_role = "Researcher"
    user.valid?.should be_true

    user.job_role = "whatever"
    user.valid?.should be_false
    user.errors[:job_role].should be_present
  end

  it "should validate password presence and length" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"

    user.valid?.should be_false
    user.errors[:password].should be_present

    user.password = 'short'
    user.valid?.should be_false
    user.errors[:password].should be_present

    user.password = 'manolo' * 11
    user.valid?.should be_false
    user.errors[:password].should be_present
  end

  it "should set default statement timeout values" do
    @user.in_database["show statement_timeout"].first[:statement_timeout].should == "5min"
    @user.in_database(as: :public_user)["show statement_timeout"].first[:statement_timeout].should == "5min"
  end

  it "should keep in sync user statement_timeout" do
    @user.user_timeout = 1000000
    @user.database_timeout = 300000
    @user.save
    @user.in_database["show statement_timeout"].first[:statement_timeout].should == "1000s"
    @user.in_database(as: :public_user)["show statement_timeout"].first[:statement_timeout].should == "5min"
  end

  it "should keep in sync database statement_timeout" do
    @user.user_timeout = 300000
    @user.database_timeout = 1000000
    @user.save
    @user.in_database["show statement_timeout"].first[:statement_timeout].should == "5min"
    @user.in_database(as: :public_user)["show statement_timeout"].first[:statement_timeout].should == "1000s"
  end

  it "should invalidate all his vizjsons when his account type changes" do
    @account_type = create_account_type_fg('WADUS')
    @user.account_type = 'WADUS'
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{@user.database_name}.*:vizjson").times(1).returns(true)
    @user.save
  end

  it "should invalidate all his vizjsons when his disqus_shortname changes" do
    @user.disqus_shortname = 'WADUS'
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{@user.database_name}.*:vizjson").times(1).returns(true)
    @user.save
  end

  it "should not invalidate anything when his quota_in_bytes changes" do
    @user.quota_in_bytes = @user.quota_in_bytes + 1.megabytes
    CartoDB::Varnish.any_instance.expects(:purge).times(0)
    @user.save
  end

  it "should rebuild the quota trigger after changing the quota" do
    @user.db_service.expects(:rebuild_quota_trigger).once
    @user.quota_in_bytes = @user.quota_in_bytes + 1.megabytes
    @user.save
  end

  it "should read api calls from external service" do
    pending "This is deprecated. This code has been moved"
    @user.stubs(:get_old_api_calls).returns({
      "per_day" => [0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 17, 4, 0, 0, 0, 0],
      "total"=>49,
      "updated_at"=>1370362756
    })
    @user.stubs(:get_es_api_calls_from_redis).returns([
      21, 0, 0, 0, 2, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ])
    @user.get_api_calls.should == [21, 0, 0, 0, 6, 17, 0, 5, 0, 0, 0, 0, 0, 0, 8, 8, 0, 5, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0]
    @user.get_api_calls(
      from: (Date.today - 6.days),
      to: Date.today
    ).should == [21, 0, 0, 0, 6, 17, 0]
  end

  it "should get final api calls from es" do
    yesterday = Date.today - 1
    today = Date.today
    from_date = DateTime.new(yesterday.year, yesterday.month, yesterday.day, 0, 0, 0).strftime("%Q")
    to_date = DateTime.new(today.year, today.month, today.day, 0, 0, 0).strftime("%Q")
    api_url = %r{search}
    api_response = {
                    "aggregations" => {
                      "0" => {
                        "buckets" => [
                          {
                            "key" => from_date.to_i,
                            "doc_count" => 4
                          },
                          {
                            "key" => to_date.to_i,
                            "doc_count" => 6
                          }
                        ]
                      }
                    }
                   }
    Typhoeus.stub(api_url,
                  { method: :post }
                 )
                  .and_return(
                    Typhoeus::Response.new(code: 200, body: api_response.to_json.to_s)
                  )
    @user.get_api_calls_from_es.should == {from_date.to_i => 4, to_date.to_i => 6}
  end

  describe "avatar checks" do
    let(:user1) do
      create_user(email: 'ewdewfref34r43r43d32f45g5@example.com', username: 'u1', password: 'foobar')
    end

    after(:each) do
      user1.destroy
    end

    it "should load a cartodb avatar url if no gravatar associated" do
      avatar_kind = Cartodb.config[:avatars]['kinds'][0]
      avatar_color = Cartodb.config[:avatars]['colors'][0]
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      Random.any_instance.stubs(:rand).returns(0)
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 404))
      user1.stubs(:gravatar_enabled?).returns(true)
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      user1.avatar_url.should == "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    end

    it "should load a cartodb avatar url if gravatar disabled" do
      avatar_kind = Cartodb.config[:avatars]['kinds'][0]
      avatar_color = Cartodb.config[:avatars]['colors'][0]
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      Random.any_instance.stubs(:rand).returns(0)
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.stubs(:gravatar_enabled?).returns(false)
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      user1.avatar_url.should == "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    end

    it "should load a the user gravatar url" do
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.stubs(:gravatar_enabled?).returns(true)
      user1.reload_avatar
      user1.avatar_url.should == "//#{user1.gravatar_user_url}"
    end

    describe '#gravatar_enabled?' do
      it 'should be enabled by default (every setting but false will enable it)' do
        user = ::User.new
        Cartodb.with_config(avatars: {}) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => true }) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'true' }) { user.gravatar_enabled?.should be_true }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'wadus' }) { user.gravatar_enabled?.should be_true }
      end

      it 'can be disabled' do
        user = ::User.new
        Cartodb.with_config(avatars: { 'gravatar_enabled' => false }) { user.gravatar_enabled?.should be_false }
        Cartodb.with_config(avatars: { 'gravatar_enabled' => 'false' }) { user.gravatar_enabled?.should be_false }
      end
    end
  end

  describe '#private_maps_enabled?' do
    it 'should not have private maps enabled by default' do
      user_missing_private_maps = create_user :email => 'user_mpm@example.com',  :username => 'usermpm',  :password => 'usermpm'
      user_missing_private_maps.private_maps_enabled?.should eq false
      user_missing_private_maps.destroy
    end

    it 'should have private maps if enabled' do
      user_with_private_maps = create_user :email => 'user_wpm@example.com',  :username => 'userwpm',  :password => 'userwpm', :private_maps_enabled => true
      user_with_private_maps.private_maps_enabled?.should eq true
      user_with_private_maps.destroy
    end

    it 'should not have private maps if disabled' do
      user_without_private_maps = create_user :email => 'user_opm@example.com',  :username => 'useropm',  :password => 'useropm', :private_maps_enabled => false
      user_without_private_maps.private_maps_enabled?.should eq false
      user_without_private_maps.destroy
    end
  end

  describe '#get_geocoding_calls' do
    before do
      delete_user_data @user
      @user.geocoder_provider = 'heremaps'
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::GeocoderUsageMetrics.new(@user.username, nil, @mock_redis)
      @usage_metrics.incr(:geocoder_here, :success_responses, 1, Time.now)
      @usage_metrics.incr(:geocoder_internal, :success_responses, 1, Time.now)
      @usage_metrics.incr(:geocoder_here, :success_responses, 1, Time.now - 5.days)
      @usage_metrics.incr(:geocoder_cache, :success_responses, 1, Time.now - 5.days)
      CartoDB::GeocoderUsageMetrics.stubs(:new).returns(@usage_metrics)
    end

    it "should return the sum of geocoded rows for the current billing period" do
      @user.get_geocoding_calls.should eq 1
    end

    it "should return the sum of geocoded rows for the specified period" do
      @user.get_geocoding_calls(from: Time.now-5.days).should eq 3
      @user.get_geocoding_calls(from: Time.now-5.days, to: Time.now - 2.days).should eq 2
    end

    it "should return 0 when no geocodings" do
      @user.get_geocoding_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_here_isolines_calls' do
    before do
      delete_user_data @user
      @user.isolines_provider = 'heremaps'
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::IsolinesUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::IsolinesUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of here isolines rows for the current billing period" do
      @usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))
      @user.get_here_isolines_calls.should eq 10
    end

    it "should return the sum of here isolines rows for the specified period" do
      @usage_metrics.incr(:here_isolines, :isolines_generated, 10, DateTime.current)
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 2))
      @usage_metrics.incr(:here_isolines, :isolines_generated, 100, (DateTime.current - 7))
      @user.get_here_isolines_calls(from: Time.now-5.days).should eq 110
      @user.get_here_isolines_calls(from: Time.now-5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no here isolines actions" do
      @user.get_here_isolines_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_obs_snapshot_calls' do
    before do
      delete_user_data @user
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::ObservatorySnapshotUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::ObservatorySnapshotUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of data observatory snapshot rows for the current billing period" do
      @usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))
      @user.get_obs_snapshot_calls.should eq 10
    end

    it "should return the sum of data observatory snapshot rows for the specified period" do
      @usage_metrics.incr(:obs_snapshot, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 2))
      @usage_metrics.incr(:obs_snapshot, :success_responses, 100, (DateTime.current - 7))
      @user.get_obs_snapshot_calls(from: Time.now - 5.days).should eq 110
      @user.get_obs_snapshot_calls(from: Time.now - 5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no here isolines actions" do
      @user.get_obs_snapshot_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe '#get_obs_general_calls' do
    before do
      delete_user_data @user
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::ObservatoryGeneralUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::ObservatoryGeneralUsageMetrics.stubs(:new).returns(@usage_metrics)
      @user.stubs(:last_billing_cycle).returns(Date.today)
      @user.period_end_date = (DateTime.current + 1) << 1
      @user.save.reload
    end

    it "should return the sum of data observatory general rows for the current billing period" do
      @usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))
      @user.get_obs_general_calls.should eq 10
    end

    it "should return the sum of data observatory general rows for the specified period" do
      @usage_metrics.incr(:obs_general, :success_responses, 10, DateTime.current)
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 2))
      @usage_metrics.incr(:obs_general, :success_responses, 100, (DateTime.current - 7))
      @user.get_obs_general_calls(from: Time.now - 5.days).should eq 110
      @user.get_obs_general_calls(from: Time.now - 5.days, to: Time.now - 2.days).should eq 100
    end

    it "should return 0 when no data observatory general actions" do
      @user.get_obs_general_calls(from: Time.now - 15.days, to: Time.now - 10.days).should eq 0
    end
  end

  describe "organization user deletion" do
    it "should transfer tweet imports to owner" do
      u1 = create_user(email: 'u1@exampleb.com', username: 'ub1', password: 'admin123')
      org = create_org('cartodbtestb', 1234567890, 5)

      u1.organization = org
      u1.save
      u1.reload
      org = u1.organization
      org.owner_id = u1.id
      org.save
      u1.reload

      u2 = create_user(email: 'u2@exampleb.com', username: 'ub2', password: 'admin123', organization: org)

      tweet_attributes = {
        user: u2,
        table_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        data_import_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        service_item_id: '555',
        state: ::SearchTweet::STATE_COMPLETE
      }

      st1 = SearchTweet.create(tweet_attributes.merge(retrieved_items: 5))
      st2 = SearchTweet.create(tweet_attributes.merge(retrieved_items: 10))

      u1.reload
      u2.reload

      u2.get_twitter_imports_count.should == st1.retrieved_items + st2.retrieved_items
      u1.get_twitter_imports_count.should == 0

      u2.destroy
      u1.reload
      u1.get_twitter_imports_count.should == st1.retrieved_items + st2.retrieved_items

      org.destroy
    end
  end

  it "should have many tables" do
    @user2.tables.should be_empty
    create_table :user_id => @user2.id, :name => 'My first table', :privacy => UserTable::PRIVACY_PUBLIC
    @user2.reload
    @user2.tables.all.should == [UserTable.first(:user_id => @user2.id)]
  end

  it "should generate a data report"

  it "should update remaining quotas when adding or removing tables" do
    initial_quota = @user2.remaining_quota

    expect { create_table :user_id => @user2.id, :privacy => UserTable::PRIVACY_PUBLIC }
      .to change { @user2.remaining_table_quota }.by(-1)

    table = Table.new(user_table: UserTable.filter(:user_id => @user2.id).first)
    50.times { |i| table.insert_row!(:name => "row #{i}") }

    @user2.remaining_quota.should be < initial_quota

    initial_quota = @user2.remaining_quota

    expect { table.destroy }
      .to change { @user2.remaining_table_quota }.by(1)
    @user2.remaining_quota.should be > initial_quota
  end

  it "should has his own database, created when the account is created" do
    @user.database_name.should == "cartodb_test_user_#{@user.id}_db"
    @user.database_username.should == "test_cartodb_user_#{@user.id}"
    @user.in_database.test_connection.should == true
  end

  it 'creates an importer schema in the user database' do
    @user.in_database[%Q(SELECT * FROM pg_namespace)]
      .map { |record| record.fetch(:nspname) }
      .should include 'cdb_importer'
  end

  it 'creates a cdb schema in the user database' do
    pending "I believe cdb schema was never used"
    @user.in_database[%Q(SELECT * FROM pg_namespace)]
      .map { |record| record.fetch(:nspname) }
      .should include 'cdb'
  end

  it 'allows access to the importer schema by the owner' do
    @user.in_database.run(%Q{
      CREATE TABLE cdb_importer.bogus ( bogus varchar(40) )
    })
    query = %Q(SELECT * FROM cdb_importer.bogus)

    expect { @user.in_database(as: :public_user)[query].to_a }
      .to raise_error(Sequel::DatabaseError)

    @user.in_database[query].to_a
  end

  it 'allows access to the cdb schema by the owner' do
    pending "I believe cdb schema was never used"
    @user.in_database.run(%Q{
      CREATE TABLE cdb.bogus ( bogus varchar(40) )
    })
    query = %Q(SELECT * FROM cdb.bogus)

    expect { @user.in_database(as: :public_user)[query].to_a }
      .to raise_error(Sequel::DatabaseError)

    @user.in_database[query].to_a
  end

  it "should create a dabase user that only can read it's own database" do

    connection = ::Sequel.connect(
      ::SequelRails.configuration.environment_for(Rails.env).merge(
        'database' => @user.database_name, :logger => ::Rails.logger,
        'username' => @user.database_username, 'password' => @user.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = nil
    connection = ::Sequel.connect(
      ::SequelRails.configuration.environment_for(Rails.env).merge(
        'database' => @user2.database_name, :logger => ::Rails.logger,
        'username' => @user.database_username, 'password' => @user.database_password
      )
    )
    begin
      connection.test_connection
      true.should_not be_true
    rescue
      true.should be_true
    ensure
      connection.disconnect
    end

    connection = ::Sequel.connect(
      ::SequelRails.configuration.environment_for(Rails.env).merge(
        'database' => @user2.database_name, :logger => ::Rails.logger,
        'username' => @user2.database_username, 'password' => @user2.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = ::Sequel.connect(
      ::SequelRails.configuration.environment_for(Rails.env).merge(
        'database' => @user.database_name, :logger => ::Rails.logger,
        'username' => @user2.database_username, 'password' => @user2.database_password
      )
    )
    begin
      connection.test_connection
      true.should_not be_true
    rescue
      true.should be_true
    ensure
      connection.disconnect
    end
  end

  it "should run valid queries against his database" do
    # initial select tests
    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows].first.keys.sort.should == [:cartodb_id, :the_geom, :the_geom_webmercator, :id, :name_of_species, :kingdom, :family, :lat, :lon, :views].sort
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"

    # update and reselect
    query_result = @user.db_service.run_pg_query("update import_csv_1 set family='polynoidae' where family='Polynoidae'")
    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0

    # check counts
    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2

    # test a product
    query_result = @user.db_service.run_pg_query("select import_csv_1.family as fam, twitters.login as login from import_csv_1, twitters where family='polynoidae' limit 10")
    query_result[:total_rows].should == 10
    query_result[:rows].first.keys.should == [:fam, :login]
    query_result[:rows][0].should == { :fam=>"polynoidae", :login=>"vzlaturistica " }

    # test counts
    query_result = @user.db_service.run_pg_query("select count(*) from import_csv_1 where family='polynoidae' ")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 1
    query_result[:rows].first.keys.should ==  [:count]
    query_result[:rows][0].should == {:count => 2}
  end

  it "should raise errors when running invalid queries against his database" do
    lambda {
      @user.db_service.run_pg_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "should run valid queries against his database in pg mode" do
    reload_user_data(@user) && @user.reload

    # initial select tests
    # tests results and modified flags
    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows].first.keys.sort.should == [:cartodb_id, :the_geom, :the_geom_webmercator, :id, :name_of_species, :kingdom, :family, :lat, :lon, :views].sort
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"
    query_result[:results].should  == true
    query_result[:modified].should == false

    # update and reselect
    query_result = @user.db_service.run_pg_query("update import_csv_1 set family='polynoidae' where family='Polynoidae'")
    query_result[:modified].should   == true
    query_result[:results].should    == false

    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0
    query_result[:modified].should   == false
    query_result[:results].should    == true

    # # check counts
    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2
    query_result[:results].should    == true

    # test a product
    query_result = @user.db_service.run_pg_query("select import_csv_1.family as fam, twitters.login as login from import_csv_1, twitters where family='polynoidae' limit 10")
    query_result[:total_rows].should == 10
    query_result[:rows].first.keys.should == [:fam, :login]
    query_result[:rows][0].should == { :fam=>"polynoidae", :login=>"vzlaturistica " }

    # test counts
    query_result = @user.db_service.run_pg_query("select count(*) from import_csv_1 where family='polynoidae' ")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 1
    query_result[:rows].first.keys.should ==  [:count]
    query_result[:rows][0].should == {:count => 2}
  end

  it "should raise errors when running invalid queries against his database in pg mode" do
    lambda {
      @user.db_service.run_pg_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "should raise errors when invalid table name used in pg mode" do
    lambda {
      @user.db_service.run_pg_query("select * from this_table_is_not_here where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::TableNotExists)
  end

  it "should raise errors when invalid column used in pg mode" do
    lambda {
      @user.db_service.run_pg_query("select not_a_col from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ColumnNotExists)
  end

  it "should create a client_application for each user" do
    @user.client_application.should_not be_nil
  end

  it "should reset its client application" do
    old_key = @user.client_application.key

    @user.reset_client_application!
    @user.reload

    @user.client_application.key.should_not == old_key
  end

  it "should return the result from the last select query if multiple selects" do
    reload_user_data(@user) && @user.reload

    query_result = @user.db_service.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 1; select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"
  end

  it "should allow multiple queries in the format: insert_query; select_query" do
    query_result = @user.db_service.run_pg_query("insert into import_csv_1 (name_of_species,family) values ('cristata barrukia','Polynoidae'); select * from import_csv_1 where family='Polynoidae' ORDER BY name_of_species ASC limit 10")
    query_result[:total_rows].should == 3
    query_result[:rows].map { |i| i[:name_of_species] }.should =~ ["Barrukia cristata", "Eulagisca gigantea", "cristata barrukia"]
  end

  it "should fail with error if table doesn't exist" do
    reload_user_data(@user) && @user.reload
    lambda {
      @user.db_service.run_pg_query("select * from wadus")
    }.should raise_error(CartoDB::TableNotExists)
  end

  it "should have a method that generates users redis users_metadata key" do
    @user.key.should == "rails:users:#{@user.username}"
  end

  it "replicates some user metadata in redis after saving" do
    @user.stubs(:database_name).returns('wadus')
    @user.save
    $users_metadata.HGET(@user.key, 'id').should == @user.id.to_s
    $users_metadata.HGET(@user.key, 'database_name').should == 'wadus'
    $users_metadata.HGET(@user.key, 'database_password').should == @user.database_password
    $users_metadata.HGET(@user.key, 'database_host').should == @user.database_host
    $users_metadata.HGET(@user.key, 'map_key').should == @user.api_key
  end

  it "should store its metadata automatically after creation" do
    user = FactoryGirl.create :user
    $users_metadata.HGET(user.key, 'id').should == user.id.to_s
    $users_metadata.HGET(user.key, 'database_name').should == user.database_name
    $users_metadata.HGET(user.key, 'database_password').should == user.database_password
    $users_metadata.HGET(user.key, 'database_host').should == user.database_host
    $users_metadata.HGET(user.key, 'map_key').should == user.api_key
    user.destroy
  end

  it "should have a method that generates users redis limits metadata key" do
    @user.timeout_key.should == "limits:timeout:#{@user.username}"
  end

  it "replicates db timeout limits in redis after saving and applies them to db" do
    @user.user_timeout = 200007
    @user.database_timeout = 100007
    @user.save
    $users_metadata.HGET(@user.timeout_key, 'db').should == '200007'
    $users_metadata.HGET(@user.timeout_key, 'db_public').should == '100007'
    @user.in_database do |db|
      db[%{SHOW statement_timeout}].first.should eq({ statement_timeout: '200007ms' })
    end
    @user.in_database(as: :public_user) do |db|
      db[%{SHOW statement_timeout}].first.should eq({ statement_timeout: '100007ms' })
    end
  end

  it "replicates render timeout limits in redis after saving" do
    @user.user_render_timeout = 200001
    @user.database_render_timeout = 100001
    @user.save
    $users_metadata.HGET(@user.timeout_key, 'render').should == '200001'
    $users_metadata.HGET(@user.timeout_key, 'render_public').should == '100001'
  end

  it "should store db timeout limits in redis after creation" do
    user = FactoryGirl.create :user, user_timeout: 200002, database_timeout: 100002
    user.user_timeout.should == 200002
    user.database_timeout.should == 100002
    $users_metadata.HGET(user.timeout_key, 'db').should == '200002'
    $users_metadata.HGET(user.timeout_key, 'db_public').should == '100002'
    user.in_database do |db|
      db[%{SHOW statement_timeout}].first.should eq({ statement_timeout: '200002ms' })
    end
    user.in_database(as: :public_user) do |db|
      db[%{SHOW statement_timeout}].first.should eq({ statement_timeout: '100002ms' })
    end
    user.destroy
  end

  it "should store render timeout limits in redis after creation" do
    user = FactoryGirl.create :user, user_render_timeout: 200003, database_render_timeout: 100003
    user.reload
    user.user_render_timeout.should == 200003
    user.database_render_timeout.should == 100003
    $users_metadata.HGET(user.timeout_key, 'render').should == '200003'
    $users_metadata.HGET(user.timeout_key, 'render_public').should == '100003'
    user.destroy
  end

  it "should have valid non-zero db timeout limits by default" do
    user = FactoryGirl.create :user
    user.user_timeout.should > 0
    user.database_timeout.should > 0
    $users_metadata.HGET(user.timeout_key, 'db').should == user.user_timeout.to_s
    $users_metadata.HGET(user.timeout_key, 'db_public').should == user.database_timeout.to_s
    user.in_database do |db|
      result = db[%{SELECT setting FROM pg_settings WHERE name = 'statement_timeout'}]
      result.first.should eq(setting: user.user_timeout.to_s)
    end
    user.in_database(as: :public_user) do |db|
      result = db[%{SELECT setting FROM pg_settings WHERE name = 'statement_timeout'}]
      result.first.should eq(setting: user.database_timeout.to_s)
    end
    user.destroy
  end

  it "should have zero render timeout limits by default" do
    user = FactoryGirl.create :user
    user.user_render_timeout.should eq 0
    user.database_render_timeout.should eq 0
    $users_metadata.HGET(user.timeout_key, 'render').should eq '0'
    $users_metadata.HGET(user.timeout_key, 'render_public').should eq '0'
    user.destroy
  end

  it "should not regenerate the api_key after saving" do
    expect { @user.save }.to_not change { @user.api_key }
  end

  it "should remove its metadata from redis after deletion" do
    doomed_user = create_user :email => 'doomed@example.com', :username => 'doomed', :password => 'doomed123'
    $users_metadata.HGET(doomed_user.key, 'id').should == doomed_user.id.to_s
    $users_metadata.HGET(doomed_user.timeout_key, 'db').should_not be_nil
    $users_metadata.HGET(doomed_user.timeout_key, 'db_public').should_not be_nil
    key = doomed_user.key
    timeout_key = doomed_user.timeout_key
    doomed_user.destroy
    $users_metadata.HGET(key, 'id').should be_nil
    $users_metadata.HGET(timeout_key, 'db').should be_nil
    $users_metadata.HGET(timeout_key, 'db_public').should be_nil
    $users_metadata.HGET(timeout_key, 'render').should be_nil
    $users_metadata.HGET(timeout_key, 'render_public').should be_nil
  end

  it "should remove its database and database user after deletion" do
    doomed_user = create_user :email => 'doomed1@example.com', :username => 'doomed1', :password => 'doomed123'
    create_table :user_id => doomed_user.id, :name => 'My first table', :privacy => UserTable::PRIVACY_PUBLIC
    doomed_user.reload
    SequelRails.connection["select count(*) from pg_catalog.pg_database where datname = '#{doomed_user.database_name}'"]
      .first[:count].should == 1
    SequelRails.connection["select count(*) from pg_catalog.pg_user where usename = '#{doomed_user.database_username}'"]
      .first[:count].should == 1

    doomed_user.destroy

    SequelRails.connection["select count(*) from pg_catalog.pg_database where datname = '#{doomed_user.database_name}'"]
      .first[:count].should == 0
    SequelRails.connection["select count(*) from pg_catalog.pg_user where usename = '#{doomed_user.database_username}'"]
      .first[:count].should == 0
  end

  it "should invalidate its Varnish cache after deletion" do
    doomed_user = create_user :email => 'doomed2@example.com', :username => 'doomed2', :password => 'doomed123'
    CartoDB::Varnish.any_instance.expects(:purge).with("#{doomed_user.database_name}.*").returns(true)

    doomed_user.destroy
  end

  it "should remove its user tables, layers and data imports after deletion" do
    doomed_user = create_user(email: 'doomed2@example.com', username: 'doomed2', password: 'doomed123')
    data_import = DataImport.create(user_id: doomed_user.id, data_source: fake_data_path('clubbing.csv')).run_import!
    doomed_user.add_layer Layer.create(kind: 'carto')
    table_id = data_import.table_id
    uuid = UserTable.where(id: table_id).first.table_visualization.id

    CartoDB::Varnish.any_instance.expects(:purge)
                    .with("#{doomed_user.database_name}.*")
                    .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
                    .with(".*#{uuid}:vizjson")
                    .at_least_once
                    .returns(true)

    doomed_user.destroy

    DataImport.where(user_id: doomed_user.id).count.should == 0
    UserTable.where(user_id: doomed_user.id).count.should == 0
    Layer.db["SELECT * from layers_users WHERE user_id = '#{doomed_user.id}'"].count.should == 0
  end

  it "should correctly identify last billing cycle" do
    user = create_user :email => 'example@example.com', :username => 'example', :password => 'testingbilling'
    Delorean.time_travel_to(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-15"))
      user.last_billing_cycle.should == Date.parse("2012-12-15")
    end
    Delorean.time_travel_to(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2012-12-02")
    end
    Delorean.time_travel_to(Date.parse("2013-03-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-31"))
      user.last_billing_cycle.should == Date.parse("2013-02-28")
    end
    Delorean.time_travel_to(Date.parse("2013-03-15")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2013-03-02")
    end
    user.destroy
    Delorean.back_to_the_present
  end

  it "should calculate the trial end date" do
    @user.stubs(:upgraded_at).returns(nil)
    @user.trial_ends_at.should be_nil
    @user.stubs(:upgraded_at).returns(Time.now - 5.days)
    @user.stubs(:account_type).returns('CORONELLI')
    @user.trial_ends_at.should be_nil
    @user.stubs(:account_type).returns('MAGELLAN')
    @user.trial_ends_at.should_not be_nil
    @user.stubs(:upgraded_at).returns(nil)
    @user.trial_ends_at.should be_nil
    @user.stubs(:upgraded_at).returns(Time.now - (::User::TRIAL_DURATION_DAYS - 1).days)
    @user.trial_ends_at.should_not be_nil
  end

  describe '#hard_geocoding_limit?' do
    it 'returns true when the plan is AMBASSADOR or FREE unless it has been manually set to false' do
      @user[:soft_geocoding_limit].should be_nil

      @user.stubs(:account_type).returns('AMBASSADOR')
      @user.soft_geocoding_limit?.should be_false
      @user.soft_geocoding_limit.should be_false
      @user.hard_geocoding_limit?.should be_true
      @user.hard_geocoding_limit.should be_true

      @user.stubs(:account_type).returns('FREE')
      @user.soft_geocoding_limit?.should be_false
      @user.soft_geocoding_limit.should be_false
      @user.hard_geocoding_limit?.should be_true
      @user.hard_geocoding_limit.should be_true

      @user.hard_geocoding_limit = false
      @user[:soft_geocoding_limit].should_not be_nil

      @user.stubs(:account_type).returns('AMBASSADOR')
      @user.soft_geocoding_limit?.should be_true
      @user.soft_geocoding_limit.should be_true
      @user.hard_geocoding_limit?.should be_false
      @user.hard_geocoding_limit.should be_false

      @user.stubs(:account_type).returns('FREE')
      @user.soft_geocoding_limit?.should be_true
      @user.soft_geocoding_limit.should be_true
      @user.hard_geocoding_limit?.should be_false
      @user.hard_geocoding_limit.should be_false
    end

    it 'returns true when for enterprise accounts unless it has been manually set to false' do
      ['ENTERPRISE', 'ENTERPRISE LUMP-SUM', 'Enterprise Medium Lumpsum AWS'].each do |account_type|
        @user.stubs(:account_type).returns(account_type)

        @user.soft_geocoding_limit = nil

        @user.soft_geocoding_limit?.should be_false
        @user.soft_geocoding_limit.should be_false
        @user.hard_geocoding_limit?.should be_true
        @user.hard_geocoding_limit.should be_true

        @user.soft_geocoding_limit = true

        @user.soft_geocoding_limit?.should be_true
        @user.soft_geocoding_limit.should be_true
        @user.hard_geocoding_limit?.should be_false
        @user.hard_geocoding_limit.should be_false
      end
    end

    it 'returns false when the plan is CORONELLI or MERCATOR unless it has been manually set to true' do
      @user.stubs(:account_type).returns('CORONELLI')
      @user.hard_geocoding_limit?.should be_false
      @user.stubs(:account_type).returns('MERCATOR')
      @user.hard_geocoding_limit?.should be_false

      @user.hard_geocoding_limit = true

      @user.stubs(:account_type).returns('CORONELLI')
      @user.hard_geocoding_limit?.should be_true
      @user.stubs(:account_type).returns('MERCATOR')
      @user.hard_geocoding_limit?.should be_true
    end
  end

  describe '#hard_here_isolines_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_here_isolines_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_here_isolines_limit?.should be_false
      @user_account.soft_here_isolines_limit.should be_false
      @user_account.hard_here_isolines_limit?.should be_true
      @user_account.hard_here_isolines_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_here_isolines_limit?.should be_false
      @user_account.soft_here_isolines_limit.should be_false
      @user_account.hard_here_isolines_limit?.should be_true
      @user_account.hard_here_isolines_limit.should be_true

      @user_account.hard_here_isolines_limit = false
      @user_account[:soft_here_isolines_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_here_isolines_limit?.should be_true
      @user_account.soft_here_isolines_limit.should be_true
      @user_account.hard_here_isolines_limit?.should be_false
      @user_account.hard_here_isolines_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_here_isolines_limit?.should be_true
      @user_account.soft_here_isolines_limit.should be_true
      @user_account.hard_here_isolines_limit?.should be_false
      @user_account.hard_here_isolines_limit.should be_false
    end

  end

  describe '#hard_obs_snapshot_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_obs_snapshot_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_snapshot_limit?.should be_false
      @user_account.soft_obs_snapshot_limit.should be_false
      @user_account.hard_obs_snapshot_limit?.should be_true
      @user_account.hard_obs_snapshot_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_snapshot_limit?.should be_false
      @user_account.soft_obs_snapshot_limit.should be_false
      @user_account.hard_obs_snapshot_limit?.should be_true
      @user_account.hard_obs_snapshot_limit.should be_true

      @user_account.hard_obs_snapshot_limit = false
      @user_account[:soft_obs_snapshot_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_snapshot_limit?.should be_true
      @user_account.soft_obs_snapshot_limit.should be_true
      @user_account.hard_obs_snapshot_limit?.should be_false
      @user_account.hard_obs_snapshot_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_snapshot_limit?.should be_true
      @user_account.soft_obs_snapshot_limit.should be_true
      @user_account.hard_obs_snapshot_limit?.should be_false
      @user_account.hard_obs_snapshot_limit.should be_false
    end

  end

  describe '#hard_obs_general_limit?' do

    before(:each) do
      @user_account = create_user
    end

    it 'returns true with every plan unless it has been manually set to false' do
      @user_account[:soft_obs_general_limit].should be_nil
      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_general_limit?.should be_false
      @user_account.soft_obs_general_limit.should be_false
      @user_account.hard_obs_general_limit?.should be_true
      @user_account.hard_obs_general_limit.should be_true

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_general_limit?.should be_false
      @user_account.soft_obs_general_limit.should be_false
      @user_account.hard_obs_general_limit?.should be_true
      @user_account.hard_obs_general_limit.should be_true

      @user_account.hard_obs_general_limit = false
      @user_account[:soft_obs_general_limit].should_not be_nil

      @user_account.stubs(:account_type).returns('AMBASSADOR')
      @user_account.soft_obs_general_limit?.should be_true
      @user_account.soft_obs_general_limit.should be_true
      @user_account.hard_obs_general_limit?.should be_false
      @user_account.hard_obs_general_limit.should be_false

      @user_account.stubs(:account_type).returns('FREE')
      @user_account.soft_obs_general_limit?.should be_true
      @user_account.soft_obs_general_limit.should be_true
      @user_account.hard_obs_general_limit?.should be_false
      @user_account.hard_obs_general_limit.should be_false
    end

  end

  describe '#shared_tables' do
    it 'Checks that shared tables include not only owned ones' do
      require_relative '../../app/models/visualization/collection'
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      bypass_named_maps
      # No need to really touch the DB for the permissions
      Table::any_instance.stubs(:add_read_permission).returns(nil)

      # We're leaking tables from some tests, make sure there are no tables
      @user.tables.all.each { |t| t.destroy }
      @user2.tables.all.each { |t| t.destroy }

      table = Table.new
      table.user_id = @user.id
      table.save.reload
      table2 = Table.new
      table2.user_id = @user.id
      table2.save.reload

      table3 = Table.new
      table3.user_id = @user2.id
      table3.name = 'sharedtable'
      table3.save.reload

      table4 = Table.new
      table4.user_id = @user2.id
      table4.name = 'table4'
      table4.save.reload

      # Only owned tables
      user_tables = tables_including_shared(@user)
      user_tables.count.should eq 2

      # Grant permission
      user2_vis  = CartoDB::Visualization::Collection.new.fetch(user_id: @user2.id, name: table3.name).first
      permission = user2_vis.permission
      permission.acl = [
        {
          type: CartoDB::Permission::TYPE_USER,
          entity: {
              id: @user.id,
              username: @user.username
          },
          access: CartoDB::Permission::ACCESS_READONLY
        }
      ]
      permission.save

      # Now owned + shared...
      user_tables = tables_including_shared(@user)
      user_tables.count.should eq 3

      contains_shared_table = false
      user_tables.each{ |item|
        contains_shared_table ||= item.id == table3.id
      }
      contains_shared_table.should eq true

      contains_shared_table = false
      user_tables.each{ |item|
        contains_shared_table ||= item.id == table4.id
      }
      contains_shared_table.should eq false

      @user.tables.all.each { |t| t.destroy }
      @user2.tables.all.each { |t| t.destroy }
    end
  end

  describe '#destroy' do
    it 'deletes database role' do
      u1 = create_user(email: 'ddr@example.com', username: 'ddr', password: 'admin123')
      role = u1.database_username
      db = u1.in_database
      db_service = u1.db_service

      db_service.role_exists?(db, role).should == true

      u1.destroy

      expect do
      db_service.role_exists?(db, role).should == false
      end.to raise_error(/role "#{role}" does not exist/)
      db.disconnect
    end

    it 'deletes api keys' do
      user = create_user(email: 'ddr@example.com', username: 'ddr', password: 'admin123')
      api_key = FactoryGirl.create(:api_key_apis, user_id: user.id)

      user.destroy
      expect(Carto::ApiKey.exists?(api_key.id)).to be_false
      expect($users_metadata.exists(api_key.send(:redis_key))).to be_false
    end

    describe "on organizations" do
      include_context 'organization with users helper'

      it 'deletes database role' do
        role = @org_user_1.database_username
        db = @org_user_1.in_database
        db_service = @org_user_1.db_service

        db_service.role_exists?(db, role).should == true

        @org_user_1.destroy

        expect do
          db_service.role_exists?(db, role).should == false
        end.to raise_error(/role "#{role}" does not exist/)
        db.disconnect
      end

      it 'deletes temporary analysis tables' do
        db = @org_user_2.in_database
        db.run('CREATE TABLE analysis_cd60938c7b_2ad1345b134ed3cd363c6de651283be9bd65094e (a int)')
        db.run(%{INSERT INTO cdb_analysis_catalog (username, cache_tables, node_id, analysis_def)
                 VALUES ('#{@org_user_2.username}', '{analysis_cd60938c7b_2ad1345b134ed3cd363c6de651283be9bd65094e}', 'a0', '{}')})
        @org_user_2.destroy

        db = @org_user_owner.in_database
        db["SELECT COUNT(*) FROM cdb_analysis_catalog WHERE username='#{@org_user_2.username}'"].first[:count].should eq 0
      end

      describe 'User#destroy' do
        include TableSharing

        it 'blocks deletion with shared entities' do
          @not_to_be_deleted = TestUserFactory.new.create_test_user(unique_name('user'), @organization)
          table = create_random_table(@not_to_be_deleted)
          share_table_with_user(table, @org_user_owner)

          expect { @not_to_be_deleted.destroy }.to raise_error(/Cannot delete user, has shared entities/)

          ::User[@not_to_be_deleted.id].should be
        end

        it 'deletes api keys and associated roles' do
          user = TestUserFactory.new.create_test_user(unique_name('user'), @organization)
          api_key = FactoryGirl.create(:api_key_apis, user_id: user.id)

          user.destroy
          expect(Carto::ApiKey.exists?(api_key.id)).to be_false
          expect($users_metadata.exists(api_key.send(:redis_key))).to be_false
          expect(
            @org_user_owner.in_database["SELECT 1 FROM pg_roles WHERE rolname = '#{api_key.db_role}'"].first
          ).to be_nil
        end
      end
    end
  end

  describe 'User#destroy_cascade' do
    include_context 'organization with users helper'
    include TableSharing

    it 'allows deletion even with shared entities' do
      table = create_random_table(@org_user_1)
      share_table_with_user(table, @org_user_1)

      @org_user_1.destroy_cascade

      ::User[@org_user_1.id].should_not be
    end
  end

  describe '#destroy_restrictions' do
    it 'Checks some scenarios upon user destruction regarding organizations' do
      u1 = create_user(email: 'u1@example.com', username: 'u1', password: 'admin123')
      u2 = create_user(email: 'u2@example.com', username: 'u2', password: 'admin123')

      org = create_org('cartodb', 1234567890, 5)

      u1.organization = org
      u1.save
      u1.reload
      u1.organization.nil?.should eq false
      org = u1.organization
      org.owner_id = u1.id
      org.save
      u1.reload
      u1.organization.owner.id.should eq u1.id

      u2.organization = org
      u2.save
      u2.reload
      u2.organization.nil?.should eq false
      u2.reload

      # Cannot remove as more users depend on the org
      expect {
        u1.destroy
      }.to raise_exception CartoDB::BaseCartoDBError

      org.destroy
    end
  end

  describe '#cartodb_postgresql_extension_versioning' do
    it 'should report pre multi user for known <0.3.0 versions' do
      before_mu_known_versions = %w(0.1.0 0.1.1 0.2.0 0.2.1)
      before_mu_known_versions.each { |version|
        stub_and_check_version_pre_mu(version, true)
      }
    end

    it 'should report post multi user for >=0.3.0 versions' do
      after_mu_known_versions = %w(0.3.0 0.3.1 0.3.2 0.3.3 0.3.4 0.3.5 0.4.0 0.5.5 0.10.0)
      after_mu_known_versions.each { |version|
        stub_and_check_version_pre_mu(version, false)
      }
    end

    it 'should report post multi user for versions with minor<3 but major>0' do
      minor_version_edge_cases = %w(1.0.0 1.0.1 1.2.0 1.2.1 1.3.0 1.4.4)
      minor_version_edge_cases.each { |version|
        stub_and_check_version_pre_mu(version, false)
      }
    end

    it 'should report correct version with old version strings' do
      before_mu_old_known_versions = [
        '0.1.0 0.1.0',
        '0.1.1 0.1.1',
        '0.2.0 0.2.0',
        '0.2.1 0.2.1'
      ]
      before_mu_old_known_versions.each { |version|
        stub_and_check_version_pre_mu(version, true)
      }
    end

    it 'should report correct version with old version strings' do
      after_mu_old_known_versions = [
        '0.3.0 0.3.0',
        '0.3.1 0.3.1',
        '0.3.2 0.3.2',
        '0.3.3 0.3.3',
        '0.3.4 0.3.4',
        '0.3.5 0.3.5',
        '0.4.0 0.4.0',
        '0.5.5 0.5.5',
        '0.10.0 0.10.0'
      ]
      after_mu_old_known_versions.each { |version|
        stub_and_check_version_pre_mu(version, false)
      }
    end

    it 'should report correct version with `git describe` not being a tag' do

      stub_and_check_version_pre_mu('0.2.1 0.2.0-8-g7840e7c', true)

      after_mu_old_known_versions = [
          '0.3.6 0.3.5-8-g7840e7c',
          '0.4.0 0.3.6-8-g7840e7c'
      ]
      after_mu_old_known_versions.each { |version|
        stub_and_check_version_pre_mu(version, false)
      }
    end

    def stub_and_check_version_pre_mu(version, is_pre_mu)
      @user.db_service.stubs(:cartodb_extension_version).returns(version)
      @user.db_service.cartodb_extension_version_pre_mu?.should eq is_pre_mu
    end

  end

  # INFO: since user can be also created in Central, and it can fail, we need to request notification explicitly. See #3022 for more info
  it "can notify a new user creation" do
    ::Resque.stubs(:enqueue).returns(nil)
    @account_type_org = create_account_type_fg('ORGANIZATION USER')
    organization = create_organization_with_owner(quota_in_bytes: 1000.megabytes)
    user1 = new_user(username: 'test',
                     email: "client@example.com",
                     organization: organization,
                     organization_id: organization.id,
                     quota_in_bytes: 20.megabytes,
                     account_type: 'ORGANIZATION USER')
    user1.id = UUIDTools::UUID.timestamp_create.to_s

    ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser, user1.id).once

    user1.save
    # INFO: if user must be synched with a remote server it should happen before notifying
    user1.notify_new_organization_user

    organization.destroy
  end

  it "Tests password change" do
    new_valid_password = '123456'

    old_crypted_password = @user.crypted_password

    @user.change_password('aaabbb', new_valid_password, new_valid_password)
    @user.valid?.should eq false

    @user.errors.fetch(:old_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "old_password Old password not valid") # "to_s" of validation msg

    @user.change_password(@user_password, 'aaabbb', 'bbbaaa')
    @user.valid?.should eq false
    @user.errors.fetch(:new_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "new_password New password doesn't match confirmation")

    @user.change_password('aaaaaa', 'aaabbb', 'bbbaaa')
    @user.valid?.should eq false
    @user.errors.fetch(:old_password).nil?.should eq false
    @user.errors.fetch(:new_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "old_password Old password not valid, new_password New password doesn't match confirmation")

    @user.change_password(@user_password, 'tiny', 'tiny')
    @user.valid?.should eq false
    @user.errors.fetch(:new_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "new_password Must be at least 6 characters long")

    long_password = 'long' * 20
    @user.change_password(@user_password, long_password, long_password)
    @user.valid?.should eq false
    @user.errors.fetch(:new_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "new_password Must be at most 64 characters long")

    @user.change_password('aaaaaa', nil, nil)
    @user.valid?.should eq false
    @user.errors.fetch(:old_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "old_password Old password not valid, new_password New password can't be blank")

    @user.change_password(@user_password, nil, nil)
    @user.valid?.should eq false
    @user.errors.fetch(:new_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "new_password New password can't be blank")

    @user.change_password(nil, nil, nil)
    @user.valid?.should eq false
    @user.errors.fetch(:old_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "old_password Old password not valid, new_password New password can't be blank")

    @user.change_password(nil, new_valid_password, new_valid_password)
    @user.valid?.should eq false
    @user.errors.fetch(:old_password).nil?.should eq false
    expect {
      @user.save(raise_on_failure: true)
    }.to raise_exception(Sequel::ValidationFailed, "old_password Old password not valid")

    @user.change_password(@user_password, new_valid_password, new_valid_password)
    @user.valid?.should eq true
    @user.save

    new_crypted_password = @user.crypted_password

    (old_crypted_password != new_crypted_password).should eq true

    @user.change_password(new_valid_password, @user_password, @user_password)
    @user.valid?.should eq true
    @user.save

    @user.crypted_password.should eq old_crypted_password

    last_password_change_date = @user.last_password_change_date
    @user.change_password(@user_password, @user_password, @user_password)
    @user.save
    @user.last_password_change_date.should eq last_password_change_date
  end

  describe "when user is signed up with google sign-in and don't have any password yet" do
    before(:each) do
      @user.google_sign_in = true
      @user.last_password_change_date = nil
      @user.save

      @user.needs_password_confirmation?.should == false

      new_valid_password = '123456'
      @user.change_password("doesn't matter in this case", new_valid_password, new_valid_password)

      @user.needs_password_confirmation?.should == true
    end

    it 'should allow updating password w/o a current password' do
      @user.valid?.should eq true
      @user.save
    end

    it 'should have updated last password change date' do
      @user.last_password_change_date.should_not eq nil
      @user.save
    end
  end

  describe "#purge_redis_vizjson_cache" do
    it "shall iterate on the user's visualizations and purge their redis cache" do
      # Create a few tables with their default vizs
      (1..3).each do |i|
        t = Table.new
        t.user_id = @user.id
        t.save
      end

      collection = CartoDB::Visualization::Collection.new.fetch({user_id: @user.id})
      redis_spy = RedisDoubles::RedisSpy.new
      redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new()
      redis_embed_cache = EmbedRedisCache.new()
      CartoDB::Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_spy)
      EmbedRedisCache.any_instance.stubs(:redis).returns(redis_spy)


      redis_vizjson_keys = collection.map { |v|
        [
          redis_vizjson_cache.key(v.id, false), redis_vizjson_cache.key(v.id, true),
          redis_vizjson_cache.key(v.id, false, 3), redis_vizjson_cache.key(v.id, true, 3),
          redis_vizjson_cache.key(v.id, false, '3n'), redis_vizjson_cache.key(v.id, true, '3n'),
          redis_vizjson_cache.key(v.id, false, '3a'), redis_vizjson_cache.key(v.id, true, '3a'),
        ]
      }.flatten
      redis_vizjson_keys.should_not be_empty

      redis_embed_keys = collection.map { |v|
        [redis_embed_cache.key(v.id, false), redis_embed_cache.key(v.id, true)]
      }.flatten
      redis_embed_keys.should_not be_empty

      @user.purge_redis_vizjson_cache

      redis_spy.deleted.should include(*redis_vizjson_keys)
      redis_spy.deleted.should include(*redis_embed_keys)
      redis_spy.deleted.count.should eq redis_vizjson_keys.count + redis_embed_keys.count
      redis_spy.invokes(:del).count.should eq 2
      redis_spy.invokes(:del).map(&:sort).should include(redis_vizjson_keys.sort)
      redis_spy.invokes(:del).map(&:sort).should include(redis_embed_keys.sort)
    end

    it "shall not fail if the user does not have visualizations" do
      user = create_user
      collection = CartoDB::Visualization::Collection.new.fetch({user_id: user.id})
      # 'http' keys
      redis_keys = collection.map(&:redis_vizjson_key)
      redis_keys.should be_empty
      # 'https' keys
      redis_keys = collection.map { |item| item.redis_vizjson_key(true) }
      redis_keys.should be_empty

      CartoDB::Visualization::Member.expects(:redis_cache).never

      user.purge_redis_vizjson_cache

      user.destroy
    end
  end

  describe "#regressions" do
    it "Tests geocodings and data import FK not breaking user destruction" do
      user = create_user
      user_id = user.id

      data_import_id = '11111111-1111-1111-1111-111111111111'

      SequelRails.connection.run(%Q{
        INSERT INTO data_imports("data_source","data_type","table_name","state","success","logger","updated_at",
          "created_at","tables_created_count",
          "table_names","append","id","table_id","user_id",
          "service_name","service_item_id","stats","type_guessing","quoted_fields_guessing","content_guessing","server","host",
          "resque_ppid","upload_host","create_visualization","user_defined_limits")
          VALUES('test','url','test','complete','t','11111111-1111-1111-1111-111111111112',
            '2015-03-17 00:00:00.94006+00','2015-03-17 00:00:00.810581+00','1',
            'test','f','#{data_import_id}','11111111-1111-1111-1111-111111111113',
            '#{user_id}','public_url', 'test',
            '[{"type":".csv","size":5015}]','t','f','t','test','0.0.0.0','13204','test','f','{"twitter_credits_limit":0}');
        })

      SequelRails.connection.run(%Q{
        INSERT INTO geocodings("table_name","processed_rows","created_at","updated_at","formatter","state",
          "id","user_id",
          "cache_hits","kind","geometry_type","processable_rows","real_rows","used_credits",
          "data_import_id"
          ) VALUES('importer_123456','197','2015-03-17 00:00:00.279934+00','2015-03-17 00:00:00.536383+00','field_1','finished',
            '11111111-1111-1111-1111-111111111114','#{user_id}','0','admin0','polygon','195','0','0',
            '#{data_import_id}');
        })

      user.destroy

      ::User.find(id:user_id).should eq nil

    end
  end

  describe '#needs_password_confirmation?' do
    it 'is true for a normal user' do
      user = FactoryGirl.build(:carto_user, :google_sign_in => nil)
      user.needs_password_confirmation?.should == true

      user = FactoryGirl.build(:user, :google_sign_in => false)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      user = FactoryGirl.build(:user, :google_sign_in => true)
      user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      user = FactoryGirl.build(:user, :google_sign_in => true, :last_password_change_date => Time.now)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that were created with http authentication' do
      user = FactoryGirl.build(:valid_user, last_password_change_date: nil)
      Carto::UserCreation.stubs(:http_authentication).returns(stub(find_by_user_id: FactoryGirl.build(:user_creation)))
      user.needs_password_confirmation?.should == false
    end
  end

  describe 'User creation and DB critical calls' do
    it 'Properly setups a new user (not belonging to an organization)' do
      CartoDB::UserModule::DBService.any_instance.stubs(
        cartodb_extension_version_pre_mu?: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      user_timeout_secs = 666

      user = ::User.new
      user.username = unique_name('user')
      user.email = unique_email
      user.password = user.email.split('@').first
      user.password_confirmation = user.password
      user.admin = false
      user.private_tables_enabled = true
      user.private_maps_enabled = true
      user.enabled = true
      user.table_quota = 500
      user.quota_in_bytes = 1234567890
      user.user_timeout = user_timeout_secs * 1000
      user.database_timeout = 123000
      user.geocoding_quota = 1000
      user.geocoding_block_price = 1500
      user.sync_tables_enabled = false
      user.organization = nil
      user.twitter_datasource_enabled = false
      user.avatar_url = user.default_avatar

      user.valid?.should == true

      user.save

      user.nil?.should == false

      # To avoid connection pool caching
      CartoDB::UserModule::DBService.terminate_database_connections(user.database_name, user.database_host)

      user.reload

      # Just to be sure all following checks will not falsely report ok using wrong schema
      user.database_schema.should eq CartoDB::UserModule::DBService::SCHEMA_PUBLIC
      user.database_schema.should_not eq user.username

      test_table_name = "table_perm_test"

      # Safety check
      user.in_database.fetch(%{
        SELECT * FROM pg_extension WHERE extname='postgis';
      }).first.nil?.should == false

      # Replicate functionality inside ::UserModule::DBService.configure_database
      # -------------------------------------------------------------------

      user.in_database.fetch(%{
        SHOW search_path;
      }).first[:search_path].should == user.db_service.build_search_path(user.database_schema, false)

      # @see http://www.postgresql.org/docs/current/static/functions-info.html#FUNCTIONS-INFO-ACCESS-TABLE
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_database_privilege('#{user.database_username}', '#{user.database_name}', 'CONNECT');
      }).first[:has_database_privilege].should == true

      # Careful as PG formatter timeout output changes to XXmin if too big
      user.in_database.fetch(%{
        SHOW statement_timeout;
      }).first[:statement_timeout].should eq "#{user_timeout_secs}s"

      # No check for `set_user_as_organization_member` as cartodb-postgresql already tests it

      # Checks for "grant_read_on_schema_queries(SCHEMA_CARTODB, db_user)"
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{user.database_schema}._cdb_userquotainbytes()', 'EXECUTE');
      }).first[:has_function_privilege].should == true
      # SCHEMA_CARTODB has no tables to select from, except CDB_CONF on which has no permission
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           'cartodb.CDB_CONF',
                                           'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
      }).first[:has_table_privilege].should == false

      # Checks on SCHEMA_PUBLIC
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.spatial_ref_sys', 'SELECT');
      }).first[:has_table_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}._postgis_stats(regclass, text, text)',
                                             'EXECUTE');
      }).first[:has_function_privilege].should == true

      # Checks on own schema
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{user.database_schema}', 'CREATE, USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database.run(%{
        CREATE TABLE #{test_table_name}(x int);
      })
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           '#{user.database_schema}.#{test_table_name}', 'SELECT');
      }).first[:has_table_privilege].should == true
      # _cdb_userquotainbytes is always created on the user schema
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{user.database_schema}._cdb_userquotainbytes()', 'EXECUTE');
      }).first[:has_function_privilege].should == true

      # Checks on non-org "owned" schemas
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_IMPORTER}', 'CREATE, USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_GEOCODING}', 'CREATE, USAGE');
      }).first[:has_schema_privilege].should == true

      # Special raster and geo columns
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.geometry_columns', 'SELECT');
      }).first[:has_table_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.geography_columns', 'SELECT');
      }).first[:has_table_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.raster_overviews', 'SELECT');
      }).first[:has_table_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.raster_columns', 'SELECT');
      }).first[:has_table_privilege].should == true

      # quota check
      user.in_database(as: :superuser).fetch(%{
        SELECT #{user.database_schema}._CDB_UserQuotaInBytes();
      }).first[:_cdb_userquotainbytes].nil?.should == false
      # Varnish invalidation function
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{user.database_username}',
          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.cdb_invalidate_varnish(text)', 'EXECUTE');
      }).first[:has_function_privilege].should == true

      # Checks of publicuser
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{user.database_schema}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_database_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{user.database_name}', 'CONNECT');
      }).first[:has_database_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{CartoDB::PUBLIC_DB_USER}',
          '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.CDB_LatLng (NUMERIC, NUMERIC)',
          'EXECUTE');
      }).first[:has_function_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.CDB_CONF',
                                           'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
      }).first[:has_table_privilege].should == false

      # Additional public user grants/revokes
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.cdb_tablemetadata',
                                           'SELECT');
      }).first[:has_table_privilege].should == false
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{CartoDB::PUBLIC_DB_USER}',
          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}._postgis_stats(regclass, text, text)',
          'EXECUTE');
      }).first[:has_function_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.spatial_ref_sys', 'SELECT');
      }).first[:has_table_privilege].should == true

      user.destroy
    end

    it 'Properly setups a new organization user' do
      CartoDB::UserModule::DBService.any_instance.stubs(
        cartodb_extension_version_pre_mu?: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      disk_quota = 1234567890
      user_timeout_secs = 666
      max_import_file_size = 6666666666
      max_import_table_row_count = 55555555
      max_concurrent_import_count = 44
      max_layers = 11

      # create an owner
      organization = create_org('org-user-creation-db-checks-organization', disk_quota * 10, 10)
      user1 = create_user email: 'user1@whatever.com', username: 'creation-db-checks-org-owner', password: 'user11'
      user1.organization = organization

      user1.max_import_file_size = max_import_file_size
      user1.max_import_table_row_count = max_import_table_row_count
      user1.max_concurrent_import_count = max_concurrent_import_count

      user1.max_layers = 11

      user1.save
      organization.owner_id = user1.id
      organization.save
      organization.reload
      user1.reload

      user = ::User.new
      user.username = unique_name('user')
      user.email = unique_email
      user.password = user.email.split('@').first
      user.password_confirmation = user.password
      user.admin = false
      user.private_tables_enabled = true
      user.private_maps_enabled = true
      user.enabled = true
      user.table_quota = 500
      user.quota_in_bytes = disk_quota
      user.user_timeout = user_timeout_secs * 1000
      user.database_timeout = 123000
      user.geocoding_quota = 1000
      user.geocoding_block_price = 1500
      user.sync_tables_enabled = false
      user.organization = organization
      user.twitter_datasource_enabled = false
      user.avatar_url = user.default_avatar

      user.valid?.should == true

      user.save

      user.nil?.should == false

      # To avoid connection pool caching
      CartoDB::UserModule::DBService.terminate_database_connections(user.database_name, user.database_host)

      user.reload

      user.max_import_file_size.should eq max_import_file_size
      user.max_import_table_row_count.should eq max_import_table_row_count
      user.max_concurrent_import_count.should eq max_concurrent_import_count

      user.max_layers.should eq max_layers

      # Just to be sure all following checks will not falsely report ok using wrong schema
      user.database_schema.should_not eq CartoDB::UserModule::DBService::SCHEMA_PUBLIC
      user.database_schema.should eq user.username

      test_table_name = "table_perm_test"

      # Safety check
      user.in_database.fetch(%{
        SELECT * FROM pg_extension WHERE extname='postgis';
      }).first.nil?.should == false

      # Replicate functionality inside ::UserModule::DBService.configure_database
      # -------------------------------------------------------------------

      user.in_database.fetch(%{
        SHOW search_path;
      }).first[:search_path].should == user.db_service.build_search_path(user.database_schema, false)

      # @see http://www.postgresql.org/docs/current/static/functions-info.html#FUNCTIONS-INFO-ACCESS-TABLE
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_database_privilege('#{user.database_username}', '#{user.database_name}', 'CONNECT');
      }).first[:has_database_privilege].should == true

      # Careful as PG formatter timeout output changes to XXmin if too big
      user.in_database.fetch(%{
        SHOW statement_timeout;
      }).first[:statement_timeout].should eq "#{user_timeout_secs}s"

      # No check for `set_user_as_organization_member` as cartodb-postgresql already tests it

      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{user.database_schema}._cdb_userquotainbytes()', 'EXECUTE');
      }).first[:has_function_privilege].should == true
      # SCHEMA_CARTODB has no tables to select from, except CDB_CONF on which has no permission
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           'cartodb.CDB_CONF',
                                           'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
      }).first[:has_table_privilege].should == false

      # Checks on SCHEMA_PUBLIC
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.spatial_ref_sys', 'SELECT');
      }).first[:has_table_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}._postgis_stats(regclass, text, text)',
                                             'EXECUTE');
      }).first[:has_function_privilege].should == true

      # Checks on own schema
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{user.database_username}',
                                           '#{user.database_schema}', 'CREATE, USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database.run(%{
        CREATE TABLE #{test_table_name}(x int);
      })
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{user.database_username}',
                                           '#{user.database_schema}.#{test_table_name}', 'SELECT');
      }).first[:has_table_privilege].should == true
      # _cdb_userquotainbytes is always created on the user schema
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege('#{user.database_username}',
                                             '#{user.database_schema}._cdb_userquotainbytes()', 'EXECUTE');
      }).first[:has_function_privilege].should == true

      # quota check
      user.in_database(as: :superuser).fetch(%{
        SELECT #{user.database_schema}._CDB_UserQuotaInBytes();
      }).first[:_cdb_userquotainbytes].nil?.should == false
      # Varnish invalidation function
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{user.database_username}',
          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.cdb_invalidate_varnish(text)', 'EXECUTE');
      }).first[:has_function_privilege].should == true

      # Checks of publicuser
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_database_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{user.database_name}', 'CONNECT');
      }).first[:has_database_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{user.database_schema}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{CartoDB::PUBLIC_DB_USER}',
          '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.CDB_LatLng (NUMERIC, NUMERIC)',
          'EXECUTE');
      }).first[:has_function_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.CDB_CONF',
                                           'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
      }).first[:has_table_privilege].should == false

      # Additional public user grants/revokes
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_CARTODB}.cdb_tablemetadata',
                                           'SELECT');
      }).first[:has_table_privilege].should == false
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_schema_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                           '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}', 'USAGE');
      }).first[:has_schema_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_function_privilege(
          '#{CartoDB::PUBLIC_DB_USER}',
          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}._postgis_stats(regclass, text, text)',
          'EXECUTE');
      }).first[:has_function_privilege].should == true
      user.in_database(as: :superuser).fetch(%{
        SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                          '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.spatial_ref_sys', 'SELECT');
      }).first[:has_table_privilege].should == true

      user.in_database.run(%{
        DROP TABLE #{user.database_schema}.#{test_table_name};
      })

      user.destroy
      organization.destroy
    end
  end

  describe "Write locking" do
    it "detects locking properly" do
      @user.db_service.writes_enabled?.should eq true
      @user.db_service.disable_writes
      @user.db_service.terminate_database_connections
      @user.db_service.writes_enabled?.should eq false
      @user.db_service.enable_writes
      @user.db_service.terminate_database_connections
      @user.db_service.writes_enabled?.should eq true
    end

    it "enables and disables writes in user database" do
      @user.db_service.run_pg_query("create table foo_1(a int);")
      @user.db_service.disable_writes
      @user.db_service.terminate_database_connections
      lambda {
        @user.db_service.run_pg_query("create table foo_2(a int);")
      }.should raise_error(CartoDB::ErrorRunningQuery)
      @user.db_service.enable_writes
      @user.db_service.terminate_database_connections
      @user.db_service.run_pg_query("create table foo_3(a int);")
    end
  end

  describe '#destroy' do
    def create_full_data
      carto_user = FactoryGirl.create(:carto_user)
      user = ::User[carto_user.id]
      table = create_table(user_id: carto_user.id, name: 'My first table', privacy: UserTable::PRIVACY_PUBLIC)
      canonical_visualization = table.table_visualization

      map = FactoryGirl.create(:carto_map_with_layers, user_id: carto_user.id)
      carto_visualization = FactoryGirl.create(:carto_visualization, user: carto_user, map: map)
      visualization = CartoDB::Visualization::Member.new(id: carto_visualization.id).fetch

      # Force ORM to cache layers (to check if they are deleted later)
      canonical_visualization.map.layers
      visualization.map.layers

      user_layer = Layer.create(kind: 'tiled')
      user.add_layer(user_layer)

      [user, table, [canonical_visualization, visualization], user_layer]
    end

    def check_deleted_data(user_id, table_id, visualizations, layer_id)
      ::User[user_id].should be_nil
      visualizations.each do |visualization|
        Carto::Visualization.exists?(visualization.id).should be_false
        visualization.map.layers.each { |layer| Carto::Layer.exists?(layer.id).should be_false }
      end
      Carto::UserTable.exists?(table_id).should be_false
      Carto::Layer.exists?(layer_id).should be_false
    end

    it 'destroys all related information' do
      user, table, visualizations, layer = create_full_data

      ::User[user.id].destroy

      check_deleted_data(user.id, table.id, visualizations, layer.id)
    end

    it 'destroys all related information, even for viewer users' do
      user, table, visualizations, layer = create_full_data
      user.viewer = true
      user.save
      user.reload

      user.destroy

      check_deleted_data(user.id, table.id, visualizations, layer.id)
    end
  end

  describe '#visualization_count' do
    include_context 'organization with users helper'
    include TableSharing

    it 'filters by type if asked' do
      vis = FactoryGirl.create(:carto_visualization, user_id: @org_user_1.id, type: Carto::Visualization::TYPE_DERIVED)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(type: Carto::Visualization::TYPE_DERIVED).should eq 1
      [Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_REMOTE].each do |type|
        @org_user_1.visualization_count(type: type).should eq 0
      end

      vis.destroy
    end

    it 'filters by privacy if asked' do
      vis = FactoryGirl.create(:carto_visualization,
                               user_id: @org_user_1.id,
                               privacy: Carto::Visualization::PRIVACY_PUBLIC)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(privacy: Carto::Visualization::PRIVACY_PUBLIC).should eq 1
      [
        Carto::Visualization::PRIVACY_PRIVATE,
        Carto::Visualization::PRIVACY_LINK,
        Carto::Visualization::PRIVACY_PROTECTED
      ].each do |privacy|
        @org_user_1.visualization_count(privacy: privacy).should eq 0
      end

      vis.destroy
    end

    it 'filters by shared exclusion if asked' do
      vis = FactoryGirl.create(:carto_visualization, user_id: @org_user_1.id, type: Carto::Visualization::TYPE_DERIVED)
      share_visualization_with_user(vis, @org_user_2)

      @org_user_2.visualization_count.should eq 1
      @org_user_2.visualization_count(exclude_shared: true).should eq 0

      vis.destroy
    end

    it 'filters by raster exclusion if asked' do
      vis = FactoryGirl.create(:carto_visualization, user_id: @org_user_1.id, kind: Carto::Visualization::KIND_RASTER)

      @org_user_1.visualization_count.should eq 1
      @org_user_1.visualization_count(exclude_raster: true).should eq 0

      vis.destroy
    end
  end

  describe 'viewer user' do
    def verify_viewer_quota(user)
      user.quota_in_bytes.should eq 0
      user.geocoding_quota.should eq 0
      user.soft_geocoding_limit.should eq false
      user.twitter_datasource_quota.should eq 0
      user.soft_twitter_datasource_limit.should eq false
      user.here_isolines_quota.should eq 0
      user.soft_here_isolines_limit.should eq false
      user.obs_snapshot_quota.should eq 0
      user.soft_obs_snapshot_limit.should eq false
      user.obs_general_quota.should eq 0
      user.soft_obs_general_limit.should eq false
    end

    describe 'creation' do
      it 'assigns 0 as quota and no soft limit no matter what is requested' do
        @user = create_user email: 'u_v@whatever.com', username: 'viewer', password: 'user11', viewer: true,
                            geocoding_quota: 10, soft_geocoding_limit: true, twitter_datasource_quota: 100,
                            soft_twitter_datasource_limit: 10, here_isolines_quota: 10, soft_here_isolines_limit: true,
                            obs_snapshot_quota: 100, soft_obs_snapshot_limit: true, obs_general_quota: 100,
                            soft_obs_general_limit: true
        verify_viewer_quota(@user)
        @user.destroy
      end
    end

    describe 'builder -> viewer' do
      it 'assigns 0 as quota and no soft limit no matter what is requested' do
        @user = create_user email: 'u_v@whatever.com', username: 'builder-to-viewer', password: 'user11', viewer: false,
                            geocoding_quota: 10, soft_geocoding_limit: true, twitter_datasource_quota: 100,
                            soft_twitter_datasource_limit: 10, here_isolines_quota: 10, soft_here_isolines_limit: true,
                            obs_snapshot_quota: 100, soft_obs_snapshot_limit: true, obs_general_quota: 100,
                            soft_obs_general_limit: true
        # Random check, but we can trust create_user
        @user.quota_in_bytes.should_not eq 0

        @user.viewer = true
        @user.save
        @user.reload
        verify_viewer_quota(@user)
        @user.destroy
      end
    end

    describe 'quotas' do
      it "can't change for viewer users" do
        @user = create_user(viewer: true)
        verify_viewer_quota(@user)
        @user.quota_in_bytes = 666
        @user.save
        @user.reload
        verify_viewer_quota(@user)
        @user.destroy
      end
    end
  end

  describe 'api keys' do
    before(:all) do
      @auth_api_feature_flag = FactoryGirl.create(:feature_flag, name: 'auth_api', restricted: false)
      @auth_api_user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @auth_api_feature_flag.destroy
      @auth_api_user.destroy
    end

    describe 'create api keys on user creation' do
      it "creates master api key on user creation if ff auth_api is enabled for the user" do
        api_keys = Carto::ApiKey.where(user_id: @auth_api_user.id)
        api_keys.should_not be_empty

        master_api_key = Carto::ApiKey.where(user_id: @auth_api_user.id).master.first
        master_api_key.should be
        master_api_key.token.should eq @auth_api_user.api_key
      end

      it "does not create master api key on user creation if ff auth_api is not enabled for the user" do
        user = FactoryGirl.create(:valid_user)
        api_keys = Carto::ApiKey.where(user_id: @user.id)
        api_keys.should be_empty
        user.destroy
      end
    end

    it 'syncs api key changes with master api key' do
      master_key = Carto::ApiKey.where(user_id: @auth_api_user.id).master.first
      expect(@auth_api_user.api_key).to eq master_key.token

      expect { @auth_api_user.regenerate_api_key }.to(change { @auth_api_user.api_key })
      master_key.reload
      expect(@auth_api_user.api_key).to eq master_key.token
    end

    describe 'are enabled/disabled' do
      before(:all) do
        @regular_key = @auth_api_user.api_keys.create_regular_key!(name: 'regkey', grants: [{ type: 'apis', apis: [] }])
      end

      after(:all) do
        @regular_key.destroy
      end

      before(:each) do
        @auth_api_user.state = 'active'
        @auth_api_user.engine_enabled = true
        @auth_api_user.save
      end

      def enabled_api_key?(api_key)
        $users_metadata.exists(api_key.send(:redis_key))
      end

      it 'disables all api keys for locked users' do
        @auth_api_user.state = 'locked'
        @auth_api_user.save

        expect(@auth_api_user.api_keys.none? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to_not eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end

      it 'disables regular keys for engine disabled' do
        @auth_api_user.engine_enabled = false
        @auth_api_user.save

        expect(@auth_api_user.api_keys.regular.none? { |k| enabled_api_key?(k) }).to be_true
        expect(@auth_api_user.api_keys.master.all? { |k| enabled_api_key?(k) }).to be_true
        expect(@auth_api_user.api_keys.default_public.all? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end

      it 'enables all keys for active engine users' do
        expect(@auth_api_user.api_keys.all? { |k| enabled_api_key?(k) }).to be_true

        expect(@auth_api_user.api_key).to eq($users_metadata.HGET(@auth_api_user.send(:key), 'map_key'))
      end
    end

    describe '#regenerate_all_api_keys' do
      before(:all) do
        @regular_key = @auth_api_user.api_keys.create_regular_key!(name: 'regkey', grants: [{ type: 'apis', apis: [] }])
      end

      after(:all) do
        @regular_key.destroy
      end

      it 'regenerates master key at user model' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @auth_api_user.api_key })
      end

      it 'regenerates master key model' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @auth_api_user.api_keys.master.first.token })
      end

      it 'regenerates regular key' do
        expect { @auth_api_user.regenerate_all_api_keys }.to(change { @regular_key.reload.token })
      end
    end
  end

  describe '#rate limits' do
    before :all do
      @limits_feature_flag = FactoryGirl.create(:feature_flag, name: 'limits_v2', restricted: false)
      @account_type = create_account_type_fg('FREE')
      @account_type_pro = create_account_type_fg('PRO')
      @account_type_org = create_account_type_fg('ORGANIZATION USER')
      @rate_limits_custom = FactoryGirl.create(:rate_limits_custom)
      @rate_limits = FactoryGirl.create(:rate_limits)
      @rate_limits_pro = FactoryGirl.create(:rate_limits_pro)
      @user_rt = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits.id)
      @organization = FactoryGirl.create(:organization)

      owner = FactoryGirl.create(:user, account_type: 'PRO')
      uo = CartoDB::UserOrganization.new(@organization.id, owner.id)
      uo.promote_user_to_admin
      @organization.reload
      @user_org = FactoryGirl.build(:user, account_type: 'FREE')
      @user_org.organization_id = @organization.id
      @user_org.enabled = true
      @user_org.save

      @map_prefix = "limits:rate:store:#{@user_rt.username}:maps:"
      @sql_prefix = "limits:rate:store:#{@user_rt.username}:sql:"
    end

    after :all do
      @user_rt.destroy unless @user_rt.nil?
      @user_no_ff.destroy unless @user_no_ff.nil?
      @organization.destroy unless @organization.nil?
      @account_type.destroy unless @account_type.nil?
      @account_type_pro.destroy unless @account_type_pro.nil?
      @account_type_org.destroy unless @account_type_org.nil?
      @account_type.rate_limit.destroy unless @account_type.nil?
      @account_type_pro.rate_limit.destroy unless @account_type_pro.nil?
      @account_type_org.rate_limit.destroy unless @account_type_org.nil?
      @rate_limits.destroy unless @rate_limits.nil?
      @rate_limits_custom.destroy unless @rate_limits_custom.nil?
      @rate_limits_custom2.destroy unless @rate_limits_custom2.nil?
      @rate_limits_pro.destroy unless @rate_limits_pro.nil?
    end

    before :each do
      unless FeatureFlag.where(name: 'limits_v2').first.present?
        @limits_feature_flag = FactoryGirl.create(:feature_flag, name: 'limits_v2', restricted: false)
      end
    end

    after :each do
      @limits_feature_flag.destroy if @limits_feature_flag.exists?
    end

    it 'does not create rate limits if feature flag is not enabled' do
      @limits_feature_flag.destroy
      @user_no_ff = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits.id)
      map_prefix = "limits:rate:store:#{@user_no_ff.username}:maps:"
      sql_prefix = "limits:rate:store:#{@user_no_ff.username}:sql:"
      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 0
      $limits_metadata.EXISTS("#{sql_prefix}query").should eq 0
    end

    it 'creates rate limits from user account type' do
      expect_rate_limits_saved_to_redis(@user_rt.username)
    end

    it 'updates rate limits from user custom rate_limit' do
      expect_rate_limits_saved_to_redis(@user_rt.username)

      @user_rt.rate_limit_id = @rate_limits_custom.id
      @user_rt.save

      expect_rate_limits_custom_saved_to_redis(@user_rt.username)
    end

    it 'creates rate limits for a org user' do
      expect_rate_limits_pro_saved_to_redis(@user_org.username)
    end

    it 'destroy rate limits' do
      user2 = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_pro.id)

      expect_rate_limits_pro_saved_to_redis(user2.username)

      user2.destroy

      expect {
        Carto::RateLimit.find(user2.rate_limit_id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      expect_rate_limits_exist(user2.username)
    end

    it 'updates rate limits when user has no rate limits' do
      user = FactoryGirl.create(:valid_user)
      user.update_rate_limits(@rate_limits.api_attributes)

      user.reload
      user.rate_limit.should_not be_nil
      user.rate_limit.api_attributes.should eq @rate_limits.api_attributes

      user.destroy
    end

    it 'does nothing when user has no rate limits' do
      user = FactoryGirl.create(:valid_user)
      user.update_rate_limits(nil)

      user.reload
      user.rate_limit.should be_nil

      user.destroy
    end

    it 'updates rate limits when user has rate limits' do
      @rate_limits_custom2 = FactoryGirl.create(:rate_limits_custom2)
      user = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_custom2.id)
      user.update_rate_limits(@rate_limits.api_attributes)
      user.reload
      user.rate_limit.should_not be_nil
      user.rate_limit_id.should eq @rate_limits_custom2.id
      user.rate_limit.api_attributes.should eq @rate_limits.api_attributes
      @rate_limits.api_attributes.should eq @rate_limits_custom2.reload.api_attributes

      user.destroy
    end

    it 'set rate limits to nil when user has rate limits' do
      @rate_limits_custom2 = FactoryGirl.create(:rate_limits_custom2)
      user = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits_custom2.id)

      user.update_rate_limits(nil)

      user.reload
      user.rate_limit.should be_nil

      expect {
        Carto::RateLimit.find(@rate_limits_custom2.id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      # limits reverted to the ones from the account type
      expect_rate_limits_saved_to_redis(user.username)

      user.destroy
    end
  end

  describe '#password_expired?' do
    before(:all) do
      @organization_password = create_organization_with_owner
    end

    after(:all) do
      @organization_password.destroy
    end

    before(:each) do
      @github_user = FactoryGirl.build(:valid_user, github_user_id: 932847)
      @google_user = FactoryGirl.build(:valid_user, google_sign_in: true)
      @password_user = FactoryGirl.build(:valid_user)
      @org_user = FactoryGirl.create(:valid_user,
                                     account_type: 'ORGANIZATION USER',
                                     organization: @organization_password)
    end

    it 'never expires without configuration' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => nil }) do
        expect(@github_user.password_expired?).to be_false
        expect(@google_user.password_expired?).to be_false
        expect(@password_user.password_expired?).to be_false
        expect(@org_user.password_expired?).to be_false
      end
    end

    it 'never expires for users without password' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        Delorean.jump(10.days)
        expect(@github_user.password_expired?).to be_false
        expect(@google_user.password_expired?).to be_false
        Delorean.back_to_the_present
      end
    end

    it 'expires for users with oauth and changed passwords' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        @github_user.last_password_change_date = Time.now - 10.days
        expect(@github_user.password_expired?).to be_true
        @google_user.last_password_change_date = Time.now - 10.days
        expect(@google_user.password_expired?).to be_true
      end
    end

    it 'expires for password users after a while has passed' do
      @password_user.save
      Cartodb.with_config(passwords: { 'expiration_in_d' => 15 }) do
        expect(@password_user.password_expired?).to be_false
        Delorean.jump(30.days)
        expect(@password_user.password_expired?).to be_true
        @password_user.password = @password_user.password_confirmation = 'waduspass'
        @password_user.save
        expect(@password_user.password_expired?).to be_false
        Delorean.jump(30.days)
        expect(@password_user.password_expired?).to be_true
        Delorean.back_to_the_present
      end
      @password_user.destroy
    end

    it 'expires for org users with password_expiration set' do
      @organization_password.stubs(:password_expiration_in_d).returns(2)
      org_user2 = FactoryGirl.create(:valid_user,
                                     account_type: 'ORGANIZATION USER',
                                     organization: @organization_password)

      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(1.day)
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(5.days)
        expect(org_user2.password_expired?).to be_true
        org_user2.password = org_user2.password_confirmation = 'waduspass'
        org_user2.save
        Delorean.jump(1.day)
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(5.day)
        expect(org_user2.password_expired?).to be_true
        Delorean.back_to_the_present
      end
    end

    it 'never expires for org users with no password_expiration set' do
      @organization_password.stubs(:password_expiration_in_d).returns(nil)
      org_user2 = FactoryGirl.create(:valid_user, organization: @organization_password)

      Cartodb.with_config(passwords: { 'expiration_in_d' => 5 }) do
        expect(org_user2.password_expired?).to be_false
        Delorean.jump(10.days)
        expect(org_user2.password_expired?).to be_false
        org_user2.password = org_user2.password_confirmation = 'waduspass'
        org_user2.save
        Delorean.jump(10.days)
        expect(org_user2.password_expired?).to be_false
        Delorean.back_to_the_present
      end
    end
  end

  protected

  def create_org(org_name, org_quota, org_seats)
    organization = Organization.new
    organization.name = unique_name(org_name)
    organization.quota_in_bytes = org_quota
    organization.seats = org_seats
    organization.save
    organization
  end

  def tables_including_shared(user)
    Carto::VisualizationQueryBuilder
      .new
      .with_owned_by_or_shared_with_user_id(user.id)
      .with_type(Carto::Visualization::TYPE_CANONICAL)
      .build.map(&:table)
  end
end
