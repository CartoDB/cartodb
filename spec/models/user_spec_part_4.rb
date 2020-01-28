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
      @auth_api_user = FactoryGirl.create(:valid_user)
    end

    after(:all) do
      @auth_api_user.destroy
    end

    describe 'create api keys on user creation' do
      it "creates master api key on user creation" do
        api_keys = Carto::ApiKey.where(user_id: @auth_api_user.id)
        api_keys.should_not be_empty

        master_api_key = Carto::ApiKey.where(user_id: @auth_api_user.id).master.first
        master_api_key.should be
        master_api_key.token.should eq @auth_api_user.api_key
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
      @user_org.organization = @organization
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

    it 'does create rate limits' do
      @user_no_ff = FactoryGirl.create(:valid_user, rate_limit_id: @rate_limits.id)
      map_prefix = "limits:rate:store:#{@user_no_ff.username}:maps:"
      sql_prefix = "limits:rate:store:#{@user_no_ff.username}:sql:"
      $limits_metadata.EXISTS("#{map_prefix}anonymous").should eq 1
      $limits_metadata.EXISTS("#{sql_prefix}query").should eq 1
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

  describe 'ghost tables event trigger' do
    it 'creates the cdb_ddl_execution table with the user' do
      table_name = @user.in_database(as: :superuser)
                        .fetch("SELECT to_regclass('cartodb.cdb_ddl_execution');")
                        .first[:to_regclass]
      table_name.should eql 'cdb_ddl_execution'
    end

    it 'removes the cdb_ddl_execution table when calling drop_ghost_tables_event_trigger' do
      @user.db_service.drop_ghost_tables_event_trigger

      table_name = @user.in_database(as: :superuser)
                        .fetch("SELECT to_regclass('cartodb.cdb_ddl_execution');")
                        .first[:to_regclass]
      table_name.should be_nil

      @user.db_service.create_ghost_tables_event_trigger
    end

    it 'saves the TIS config from app_config.yml to cdb_conf' do
      CartoDB::UserModule::DBService.any_instance.unstub(:configure_ghost_table_event_trigger)
      user = create_user

      cdb_conf = user.in_database(as: :superuser)
                     .fetch("SELECT cartodb.CDB_Conf_GetConf('invalidation_service')").first[:cdb_conf_getconf]
      cdb_conf.should be

      user.destroy
      CartoDB::UserModule::DBService.any_instance.stubs(:configure_ghost_table_event_trigger).returns(true)
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
