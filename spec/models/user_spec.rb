# coding: UTF-8

require 'ostruct'
require_relative '../spec_helper'
require_relative 'user_shared_examples'
require_relative '../../services/dataservices-metrics/lib/here_isolines_usage_metrics'
require 'factories/organizations_contexts'
require_relative '../../app/model_factories/layer_factory'

describe 'refactored behaviour' do

  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).get_twitter_imports_count
    end

    def get_user_by_id(user_id)
      ::User.where(id: user_id).first
    end
  end

end

describe User do
  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  before(:all) do
    stub_named_maps_calls

    @user_password = 'admin123'
    puts "\n[rspec][user_spec] Creating test user databases..."
    @user     = create_user :email => 'admin@example.com', :username => 'admin', :password => @user_password
    @user2    = create_user :email => 'user@example.com',  :username => 'user',  :password => 'user123'

    puts "[rspec][user_spec] Loading user data..."
    reload_user_data(@user) && @user.reload

    puts "[rspec][user_spec] Running..."
  end

  before(:each) do
    stub_named_maps_calls
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
    Table.any_instance.stubs(:update_cdb_tablemetadata)
  end

  after(:all) do
    stub_named_maps_calls
    @user.destroy
    @user2.destroy
  end

  it "Should properly report ability to change (or not) email & password when proceeds" do
    @user.google_sign_in = false
    password_change_date = @user.last_password_change_date
    Carto::Ldap::Manager.any_instance.stubs(:configuration_present?).returns(false)

    @user.can_change_email?.should eq true
    @user.can_change_password?.should eq true

    @user.google_sign_in = true
    @user.can_change_email?.should eq false

    @user.last_password_change_date = nil
    @user.can_change_email?.should eq false

    Carto::Ldap::Manager.any_instance.stubs(:configuration_present?).returns(true)
    @user.can_change_email?.should eq false

    @user.last_password_change_date = password_change_date
    @user.google_sign_in = false
    @user.can_change_email?.should eq false

    @user.can_change_password?.should eq false

  end

  it "should set a default database_host" do
    @user.database_host.should eq ::Rails::Sequel.configuration.environment_for(Rails.env)['host']
  end

  it "should set a default api_key" do
    @user.reload.api_key.should_not be_blank
  end

  it "should set created_at" do
    @user.created_at.should_not be_nil
  end

  it "should update updated_at" do
    expect { @user.save }.to change(@user, :updated_at)
  end

  it "should set up a user after create" do
    @new_user = new_user
    @new_user.save
    @new_user.reload
    @new_user.should_not be_new
    @new_user.database_name.should_not be_nil
    @new_user.in_database.test_connection.should == true
    @new_user.destroy
  end

  it "should have a crypted password" do
    @user.crypted_password.should_not be_blank
    @user.crypted_password.should_not == 'admin123'
  end

  it "should authenticate if given email and password are correct" do
    response_user = ::User.authenticate('admin@example.com', 'admin123')
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    ::User.authenticate('admin@example.com', 'admin321').should be_nil
    ::User.authenticate('', '').should be_nil
  end

  it "should authenticate with case-insensitive email and username" do
    response_user = ::User.authenticate('admin@example.com', 'admin123')
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    response_user_2 = ::User.authenticate('aDMin@eXaMpLe.Com', 'admin123')
    response_user_2.id.should eq @user.id
    response_user_2.email.should eq @user.email

    response_user_3 = ::User.authenticate('admin', 'admin123')
    response_user_3.id.should eq @user.id
    response_user_3.email.should eq @user.email

    response_user_4 = ::User.authenticate('ADMIN', 'admin123')
    response_user_4.id.should eq @user.id
    response_user_4.email.should eq @user.email
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
    create_org('testusername', 10.megabytes, 1)
    @user.username = 'testusername'
    @user.valid?.should be_false
    @user.username = 'wadus'
    @user.valid?.should be_true
  end

  describe 'organization checks' do
    it "should not be valid if his organization doesn't have more seats" do

      organization = create_org('testorg', 10.megabytes, 1)
      user1 = create_user email: 'user1@testorg.com', username: 'user1', password: 'user11'
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
        u.max_layers.should == 6
        u.private_tables_enabled.should be_true
        u.sync_tables_enabled.should be_true
      end
      user = FactoryGirl.build(:user, organization: organization)
      user.max_layers = 3
      user.private_tables_enabled = false
      user.sync_tables_enabled = false
      user.save
      user.max_layers.should == 3
      user.private_tables_enabled.should be_false
      user.sync_tables_enabled.should be_false
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
        u.dedicated_support?.should be_true
        u.remove_logo?.should be_true
        u.private_maps_enabled.should be_true
      end
      organization.destroy
    end
  end

  describe 'central synchronization' do
    it 'should create remote user in central if needed' do
      pending "Central API credentials not provided" unless ::User.new.sync_data_with_cartodb_central?
      organization = create_org('testorg', 500.megabytes, 1)
      user = create_user email: 'user1@testorg.com', username: 'user1', password: 'user11'
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
    Rails::Sequel.connection["select count(*) from feature_flags_users where user_id = '#{user_id}'"].first[:count].should eq 0
    Rails::Sequel.connection["select count(*) from feature_flags where id = '#{ff.id}'"].first[:count].should eq 1
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

    it "should load a cartodb avatar url" do
      avatar_kind = Cartodb.config[:avatars]['kinds'][0]
      avatar_color = Cartodb.config[:avatars]['colors'][0]
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      Random.any_instance.stubs(:rand).returns(0)
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 404))
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      user1.avatar_url.should == "#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png"
    end

    it "should load a the user gravatar url" do
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.reload_avatar
      user1.avatar_url.should == "//#{user1.gravatar_user_url}"
    end
  end

  describe '#overquota' do
    it "should return users over their map view quota, excluding organization users" do
      ::User.overquota.should be_empty
      ::User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      ::User.any_instance.stubs(:map_view_quota).returns 10
      ::User.overquota.map(&:id).should include(@user.id)
      ::User.overquota.size.should == ::User.reject{|u| u.organization_id.present? }.count
    end

    it "should return users near their map view quota" do
      ::User.any_instance.stubs(:get_api_calls).returns([81])
      ::User.any_instance.stubs(:map_view_quota).returns(100)
      ::User.overquota.should be_empty
      ::User.overquota(0.20).map(&:id).should include(@user.id)
      ::User.overquota(0.20).size.should == ::User.reject{|u| u.organization_id.present? }.count
      ::User.overquota(0.10).should be_empty
    end

    it "should return users near their geocoding quota" do
      ::User.any_instance.stubs(:get_api_calls).returns([0])
      ::User.any_instance.stubs(:map_view_quota).returns(120)
      ::User.any_instance.stubs(:get_geocoding_calls).returns(81)
      ::User.any_instance.stubs(:geocoding_quota).returns(100)
      ::User.overquota.should be_empty
      ::User.overquota(0.20).map(&:id).should include(@user.id)
      ::User.overquota(0.20).size.should == ::User.reject{|u| u.organization_id.present? }.count
      ::User.overquota(0.10).should be_empty
    end

    it "should return users near their here isolines quota" do
      ::User.any_instance.stubs(:get_api_calls).returns([0])
      ::User.any_instance.stubs(:map_view_quota).returns(120)
      ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
      ::User.any_instance.stubs(:geocoding_quota).returns(100)
      ::User.any_instance.stubs(:get_here_isolines_calls).returns(81)
      ::User.any_instance.stubs(:here_isolines_quota).returns(100)
      ::User.overquota.should be_empty
      ::User.overquota(0.20).map(&:id).should include(@user.id)
      ::User.overquota(0.20).size.should == ::User.reject{|u| u.organization_id.present? }.count
      ::User.overquota(0.10).should be_empty
    end

    it "should return users near their twitter quota" do
      ::User.any_instance.stubs(:get_api_calls).returns([0])
      ::User.any_instance.stubs(:map_view_quota).returns(120)
      ::User.any_instance.stubs(:get_geocoding_calls).returns(0)
      ::User.any_instance.stubs(:geocoding_quota).returns(100)
      ::User.any_instance.stubs(:get_twitter_imports_count).returns(81)
      ::User.any_instance.stubs(:twitter_datasource_quota).returns(100)
      ::User.overquota.should be_empty
      ::User.overquota(0.20).map(&:id).should include(@user.id)
      ::User.overquota(0.20).size.should == ::User.reject{|u| u.organization_id.present? }.count
      ::User.overquota(0.10).should be_empty
    end

    it "should not return organization users" do
      ::User.any_instance.stubs(:organization_id).returns("organization-id")
      ::User.any_instance.stubs(:organization).returns(Organization.new)
      ::User.overquota.should be_empty
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

    it 'should have private maps if he has private_tables_enabled, even if disabled' do
      user_without_private_maps = create_user :email => 'user_opm3@example.com',  :username => 'useropm3',  :password => 'useropm3', :private_maps_enabled => false, :private_tables_enabled => true
      user_without_private_maps.private_maps_enabled?.should eq true
      user_without_private_maps.destroy
    end

    it 'should not have private maps if he is AMBASSADOR' do
      user_without_private_maps = create_user :email => 'user_opm2@example.com',  :username => 'useropm2',  :password => 'useropm2', :private_maps_enabled => false
      user_without_private_maps.stubs(:account_type).returns('AMBASSADOR')
      user_without_private_maps.private_maps_enabled?.should eq false
      user_without_private_maps.destroy
    end

  end

  describe '#get_geocoding_calls' do
    before do
      delete_user_data @user
      @user.stubs(:last_billing_cycle).returns(Date.today)
      FactoryGirl.create(:geocoding, user: @user, kind: 'high-resolution', created_at: Time.now, processed_rows: 1)
      FactoryGirl.create(:geocoding, user: @user, kind: 'admin0', created_at: Time.now, processed_rows: 1)
      FactoryGirl.create(:geocoding, user: @user, kind: 'high-resolution', created_at: Time.now - 5.days, processed_rows: 1, cache_hits: 1)
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
      @mock_redis = MockRedis.new
      @usage_metrics = CartoDB::HereIsolinesUsageMetrics.new(@user.username, nil, @mock_redis)
      CartoDB::HereIsolinesUsageMetrics.stubs(:new).returns(@usage_metrics)
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

  describe "organization user deletion" do
    it "should transfer geocodings and tweet imports to owner" do
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

      FactoryGirl.create(:geocoding, user: u2, kind: 'high-resolution', created_at: Time.now, processed_rows: 1, formatter: 'b')

      st = SearchTweet.new
      st.user = u2
      st.table_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.data_import_id = '96a86fb7-0270-4255-a327-15410c2d49d4'
      st.service_item_id = '555'
      st.retrieved_items = 5
      st.state = ::SearchTweet::STATE_COMPLETE
      st.save

      u1.reload
      u2.reload
      u2.get_geocoding_calls.should == 1
      u2.get_twitter_imports_count.should == 5
      u1.get_geocoding_calls.should == 0
      u1.get_twitter_imports_count.should == 0

      u2.destroy
      u1.reload
      u1.get_geocoding_calls.should == 1
      u1.get_twitter_imports_count.should == 5

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
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => @user.database_name, :logger => ::Rails.logger,
        'username' => @user.database_username, 'password' => @user.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = nil
    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
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
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => @user2.database_name, :logger => ::Rails.logger,
        'username' => @user2.database_username, 'password' => @user2.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
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

  it "should not regenerate the api_key after saving" do
    expect { @user.save }.to_not change { @user.api_key }
  end

  it "should remove its metadata from redis after deletion" do
    doomed_user = create_user :email => 'doomed@example.com', :username => 'doomed', :password => 'doomed123'
    $users_metadata.HGET(doomed_user.key, 'id').should == doomed_user.id.to_s
    key = doomed_user.key
    doomed_user.destroy
    $users_metadata.HGET(doomed_user.key, 'id').should be_nil
  end

  it "should remove its database and database user after deletion" do
    doomed_user = create_user :email => 'doomed1@example.com', :username => 'doomed1', :password => 'doomed123'
    create_table :user_id => doomed_user.id, :name => 'My first table', :privacy => UserTable::PRIVACY_PUBLIC
    doomed_user.reload
    Rails::Sequel.connection["select count(*) from pg_catalog.pg_database where datname = '#{doomed_user.database_name}'"]
      .first[:count].should == 1
    Rails::Sequel.connection["select count(*) from pg_catalog.pg_user where usename = '#{doomed_user.database_username}'"]
      .first[:count].should == 1

    doomed_user.destroy

    Rails::Sequel.connection["select count(*) from pg_catalog.pg_database where datname = '#{doomed_user.database_name}'"]
      .first[:count].should == 0
    Rails::Sequel.connection["select count(*) from pg_catalog.pg_user where usename = '#{doomed_user.database_username}'"]
      .first[:count].should == 0
  end

  it "should invalidate its Varnish cache after deletion" do
    doomed_user = create_user :email => 'doomed2@example.com', :username => 'doomed2', :password => 'doomed123'
    CartoDB::Varnish.any_instance.expects(:purge).with("#{doomed_user.database_name}.*").returns(true)

    doomed_user.destroy
  end

  it "should remove its user tables, layers and data imports after deletion" do
    doomed_user = create_user :email => 'doomed2@example.com', :username => 'doomed2', :password => 'doomed123'
    data_import = DataImport.create(:user_id     => doomed_user.id,
                      :data_source => '/../db/fake_data/clubbing.csv').run_import!
    doomed_user.add_layer Layer.create(:kind => 'carto')
    table_id  = data_import.table_id
    uuid      = UserTable.where(id: table_id).first.table_visualization.id

    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{doomed_user.database_name}.*")
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with(".*#{uuid}:vizjson")
      .times(2 + 5)
      .returns(true)

    doomed_user.destroy

    DataImport.where(:user_id => doomed_user.id).count.should == 0
    UserTable.where(:user_id => doomed_user.id).count.should == 0
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

  describe '#link_ghost_tables' do
    before(:each) do
      @user.in_database.run('drop table if exists ghost_table')
      @user.in_database.run('drop table if exists non_ghost_table')
      @user.in_database.run('drop table if exists ghost_table_renamed')
      @user.reload
      @user.table_quota = 100
      @user.save
    end

    it "should correctly count real tables" do
      @user.in_database.run('create table ghost_table (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry, updated_at date, created_at date)')
      @user.in_database.run('create table non_ghost_table (test integer)')
      @user.real_tables.map { |c| c[:relname] }.should =~ ["ghost_table", "non_ghost_table"]
      @user.real_tables.size.should == 2
    end

    it "should return cartodbfied tables" do
      @user.in_database.run('create table ghost_table (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry, updated_at date, created_at date)')

      @user.in_database.run(%Q{
        CREATE OR REPLACE FUNCTION test_quota_per_row()
          RETURNS trigger
          AS $$
          BEGIN
            RETURN NULL;
          END;
          $$
          LANGUAGE plpgsql;
      })
      @user.in_database.run( %Q{
        CREATE TRIGGER test_quota_per_row BEFORE INSERT ON ghost_table EXECUTE PROCEDURE test_quota_per_row()
      })

      @user.in_database.run('create table non_ghost_table (test integer)')
      tables = @user.search_for_cartodbfied_tables
      tables.should =~ ['ghost_table']
    end

    it "should link a table in the database" do
      tables = @user.tables.all.map(&:name)
      @user.in_database.run('create table ghost_table (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry, updated_at date, created_at date)')

      @user.in_database.run(%Q{
        CREATE OR REPLACE FUNCTION test_quota_per_row()
          RETURNS trigger
          AS $$
          BEGIN
            RETURN NULL;
          END;
          $$
          LANGUAGE plpgsql;
      })
      @user.in_database.run( %Q{
        CREATE TRIGGER test_quota_per_row BEFORE INSERT ON ghost_table EXECUTE PROCEDURE test_quota_per_row()
      })

      @user.link_ghost_tables
      new_tables = @user.tables.all.map(&:name)
      new_tables.should include('ghost_table')
    end

    it "should link a renamed table in the database" do
      tables = @user.tables.all.map(&:name)
      @user.in_database.run('create table ghost_table_2 (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry, updated_at date, created_at date)')

      @user.in_database.run(%Q{
        CREATE OR REPLACE FUNCTION test_quota_per_row()
          RETURNS trigger
          AS $$
          BEGIN
            RETURN NULL;
          END;
          $$
          LANGUAGE plpgsql;
      })
      @user.in_database.run( %Q{
        CREATE TRIGGER test_quota_per_row BEFORE INSERT ON ghost_table_2 EXECUTE PROCEDURE test_quota_per_row()
      })

      @user.link_ghost_tables
      @user.in_database.run('alter table ghost_table_2 rename to ghost_table_renamed')
      @user.link_ghost_tables
      new_tables = @user.tables.all.map(&:name)
      new_tables.should include('ghost_table_renamed')
      new_tables.should_not include('ghost_table_2')
      # check visualization name
      table = @user.tables.find(:name => 'ghost_table_renamed').first
      table.table_visualization.name.should == 'ghost_table_renamed'


    end

    it "should remove reference to a removed table in the database" do
      tables = @user.tables.all.map(&:name)
      @user.in_database.run('create table ghost_table (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry, updated_at date, created_at date)')
      @user.link_ghost_tables
      @user.in_database.run('drop table ghost_table')
      @user.link_ghost_tables
      new_tables = @user.tables.all.map(&:name)
      new_tables.should_not include('ghost_table')
    end

    # not sure what the following tests mean or why they were
    # created
    xit "should link a table with null table_id" do
      table = create_table :user_id => @user.id, :name => 'My table'
      initial_count = @user.tables.count
      table_id = table.table_id
      table.this.update table_id: nil
      @user.link_ghost_tables
      table.reload
      table.table_id.should == table_id
      @user.tables.count.should == initial_count
    end

    xit "should link a table with wrong table_id" do
      table = create_table :user_id => @user.id, :name => 'My table 2'
      initial_count = @user.tables.count
      table_id = table.table_id
      table.this.update table_id: 1
      @user.link_ghost_tables
      table.reload
      table.table_id.should == table_id
      @user.tables.count.should == initial_count
    end

    it "should remove a table that does not exist on the user database" do
      initial_count = @user.tables.count
      table = create_table :user_id => @user.id, :name => 'My table 3'
      puts "dropping", table.name
      @user.in_database.drop_table(table.name)
      @user.tables.where(name: table.name).first.should_not be_nil
      @user.link_ghost_tables
      @user.tables.where(name: table.name).first.should be_nil
    end

    it "should link a table that requires quoting, e.g: name with capitals" do
      initial_count = @user.tables.count
      @user.in_database.run %Q{CREATE TABLE "MyTableWithCapitals" (cartodb_id integer, the_geom geometry, the_geom_webmercator geometry)}
      @user.in_database.run(%Q{
        CREATE OR REPLACE FUNCTION test_quota_per_row()
          RETURNS trigger
          AS $$
          BEGIN
            RETURN NULL;
          END;
          $$
          LANGUAGE plpgsql;
      })
      @user.in_database.run %Q{CREATE TRIGGER test_quota_per_row BEFORE INSERT ON "MyTableWithCapitals" EXECUTE PROCEDURE test_quota_per_row()}

      @user.link_ghost_tables

      # TODO: the table won't be cartodbfy'ed and registered until we support CamelCase identifiers.
      @user.tables.count.should == initial_count
    end

  end

  describe '#shared_tables' do
    it 'Checks that shared tables include not only owned ones' do
      require_relative '../../app/models/visualization/collection'
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
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
      user_tables = @user.tables_including_shared
      user_tables.count.should eq 2

      # Grant permission
      user2_vis  = CartoDB::Visualization::Collection.new.fetch(user_id: @user2.id, name: table3.name).first
      permission = CartoDB::Permission.new(
        owner_id:       @user2.id,
        owner_username: @user2.username,
        entity_id:      user2_vis.id,
        entity_type:    CartoDB::Permission::ENTITY_TYPE_VISUALIZATION
      )
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
      user_tables = @user.tables_including_shared
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

    organization = create_organization_with_owner(quota_in_bytes: 1000.megabytes)
    user1 = new_user(:username => 'test', :email => "client@example.com", :organization => organization, :organization_id => organization.id, :quota_in_bytes => 20.megabytes)
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
      redis_mock = mock
      redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new()
      redis_embed_cache = EmbedRedisCache.new()
      CartoDB::Visualization::RedisVizjsonCache.any_instance.stubs(:redis).returns(redis_mock)
      EmbedRedisCache.any_instance.stubs(:redis).returns(redis_mock)


      redis_vizjson_keys = collection.map {|v| [redis_vizjson_cache.key(v.id, false), redis_vizjson_cache.key(v.id, true)] }.flatten
      redis_vizjson_keys.should_not be_empty

      redis_embed_keys = collection.map {|v| [redis_embed_cache.key(v.id, false), redis_embed_cache.key(v.id, true)] }.flatten
      redis_embed_keys.should_not be_empty


      redis_mock.expects(:del).once.with(redis_vizjson_keys)
      redis_mock.expects(:del).once.with(redis_embed_keys)

      @user.purge_redis_vizjson_cache
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

      Rails::Sequel.connection.run(%Q{
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

      Rails::Sequel.connection.run(%Q{
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
      # INFO: avoiding enable_remote_db_user
      Cartodb.config[:signups] = nil

      CartoDB::UserModule::DBService.any_instance.stubs(
        cartodb_extension_version_pre_mu?: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      user_timeout_secs = 666

      user = ::User.new
      user.username = String.random(8).downcase
      user.email = String.random(8).downcase + '@' + String.random(5).downcase + '.com'
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
      # INFO: avoiding enable_remote_db_user
      Cartodb.config[:signups] = nil

      CartoDB::UserModule::DBService.any_instance.stubs(
        cartodb_extension_version_pre_mu?: nil,
        monitor_user_notification: nil,
        enable_remote_db_user: nil
      )

      disk_quota = 1234567890
      user_timeout_secs = 666

      # create an owner
      organization = create_org('org-user-creation-db-checks-organization', disk_quota * 10, 10)
      user1 = create_user email: 'user1@whatever.com', username: 'creation-db-checks-org-owner', password: 'user11'
      user1.organization = organization
      user1.save
      organization.owner_id = user1.id
      organization.save
      organization.reload
      user1.reload

      user = ::User.new
      user.username = String.random(8).downcase
      user.email = String.random(8).downcase + '@' + String.random(5).downcase + '.com'
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

  protected

  def create_org(org_name, org_quota, org_seats)
    organization = Organization.new
    organization.name = org_name
    organization.quota_in_bytes = org_quota
    organization.seats = org_seats
    organization.save!
    organization
  end
end
