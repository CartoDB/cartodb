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
    it "should not be valid if their organization doesn't have more seats" do
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

    it 'should be valid if their organization has enough seats' do
      organization = create_org('testorg', 10.megabytes, 1)
      user = ::User.new
      user.organization = organization
      user.valid?
      user.errors.keys.should_not include(:organization)
      organization.destroy
    end

    it "should not be valid if their organization doesn't have enough disk space" do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(10.megabytes)
      user = ::User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?.should be_false
      user.errors.keys.should include(:quota_in_bytes)
      organization.destroy
    end

    it 'should be valid if their organization has enough disk space' do
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
      it 'should be valid if their organization has enough disk space' do
        organization = create_organization_with_users(quota_in_bytes: 70.megabytes)
        organization.assigned_quota.should == 70.megabytes
        user = organization.owner
        user.quota_in_bytes = 1.megabyte
        user.valid?
        user.errors.keys.should_not include(:quota_in_bytes)
        organization.destroy
      end
      it "should not be valid if their organization doesn't have enough disk space" do
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

    it 'should inherit twitter_datasource_enabled from organizations with custom config on creation' do
      organization = create_organization_with_users(twitter_datasource_enabled: true)
      organization.save
      organization.twitter_datasource_enabled.should be_true
      organization.users.reject(&:organization_owner?).each do |u|
        CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).with(Search::Twitter::DATASOURCE_NAME, u).returns(true)
        u.twitter_datasource_enabled.should be_true
      end
      CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).returns(true)
      user = create_user(organization: organization)
      user.save
      CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).with(Search::Twitter::DATASOURCE_NAME, user).returns(true)
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

    user = create_user email: 'ff@example.com', username: 'ff-user-01', password: '000ff-user-01'
    user.set_relationships_from_central({ feature_flags: [ ff.id.to_s ]})
    user.save
    user.feature_flags_user.map { |ffu| ffu.feature_flag_id }.should include(ff.id)
    user.destroy
  end

  it 'should delete feature flags assignations to a deleted user' do
    ff = FactoryGirl.create(:feature_flag, id: 10002, name: 'ff10002')

    user = create_user email: 'ff2@example.com', username: 'ff2-user-01', password: '000ff2-user-01'
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

  describe "email validation" do
    before(:all) do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :mx)
    end

    after(:all) do
      EmailAddress::Config.configure(local_format: :conventional, host_validation: :syntax)
    end

    it "disallows wrong domains" do
      invalid_emails = ['pimpam@example.com',
                        'pimpam@ageval.dr',
                        'pimpam@qq.ocm',
                        'pimpam@aa.ww',
                        'pimpam@iu.eduy',
                        'pimpam@gmail.como',
                        'pimpam@namr.cim',
                        'pimpam@buffalo.edi']

      invalid_emails.each do |email|
        user = ::User.new(email: email)

        user.valid?.should be_false
        user.errors.should include :email
      end
    end
  end

  it "should validate that password is present if record is new and crypted_password is blank" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"

    user.valid?.should be_false
    user.errors[:password].should be_present

    another_user = new_user(user.values.merge(:password => "admin123"))
    user.crypted_password = another_user.crypted_password
    user.valid?.should be_true
    user.save

    # Let's ensure that crypted_password does not change
    user_check = ::User[user.id]
    user_check.crypted_password.should == another_user.crypted_password

    user.password = nil
    user.valid?.should be_true

    user.destroy
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

  it "should validate password is different than username" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"
    user.password = user.password_confirmation = "adminipop"

    user.valid?.should be_false
    user.errors[:password].should be_present
  end

  it "should validate password is not a common one" do
    user = ::User.new
    user.username = "adminipop"
    user.email = "adminipop@example.com"
    user.password = user.password_confirmation = '123456'

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

  it "should invalidate all their vizjsons when their account type changes" do
    @account_type = create_account_type_fg('WADUS')
    @user.account_type = 'WADUS'
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{@user.database_name}.*:vizjson").times(1).returns(true)
    @user.save
  end

  it "should invalidate all their vizjsons when their disqus_shortname changes" do
    @user.disqus_shortname = 'WADUS'
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{@user.database_name}.*:vizjson").times(1).returns(true)
    @user.save
  end

  it "should not invalidate anything when their quota_in_bytes changes" do
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
      user_missing_private_maps = create_user email: 'user_mpm@example.com',
                                              username: 'usermpm',
                                              password: '000usermpm'
      user_missing_private_maps.private_maps_enabled?.should eq false
      user_missing_private_maps.destroy
    end

    it 'should have private maps if enabled' do
      user_with_private_maps = create_user email: 'user_wpm@example.com',
                                           username: 'userwpm',
                                           password: '000userwpm',
                                           private_maps_enabled: true
      user_with_private_maps.private_maps_enabled?.should eq true
      user_with_private_maps.destroy
    end

    it 'should not have private maps if disabled' do
      user_without_private_maps = create_user email: 'user_opm@example.com',
                                              username: 'useropm',
                                              password: '000useropm',
                                              private_maps_enabled: false
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
