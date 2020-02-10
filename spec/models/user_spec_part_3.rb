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

  describe "#change_password" do
    before(:all) do
      @new_valid_password = '000123456'
      @user3 = create_user(password: @user_password)
    end

    after(:all) do
      @user3.destroy
    end

    it "updates crypted_password" do
      initial_crypted_password = @user3.crypted_password
      @user3.change_password(@user_password, @new_valid_password, @new_valid_password)
      @user3.valid?.should eq true
      @user3.save(raise_on_failure: true)
      @user3.crypted_password.should_not eql initial_crypted_password

      @user3.change_password(@new_valid_password, @user_password, @user_password)
      @user3.save(raise_on_failure: true)
    end

    it "checks old password" do
      @user3.change_password('aaabbb', @new_valid_password, @new_valid_password)
      @user3.valid?.should eq false
      @user3.errors.fetch(:old_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, /old_password Old password not valid/)
    end

    it "checks password confirmation" do
      @user3.change_password(@user_password, 'aaabbb', 'bbbaaa')
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password doesn't match confirmation")
    end

    it "can throw several errors" do
      @user3.change_password('aaaaaa', 'aaabbb', 'bbbaaa')
      @user3.valid?.should eq false
      @user3.errors.fetch(:old_password).nil?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expected_errors = "old_password Old password not valid, new_password doesn't match confirmation"
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, expected_errors)
    end

    it "checks minimal length" do
      @user3.change_password(@user_password, 'tiny', 'tiny')
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password must be at least 6 characters long")
    end

    it "checks maximal length" do
      long_password = 'long' * 20
      @user3.change_password(@user_password, long_password, long_password)
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password must be at most 64 characters long")
    end

    it "checks that the new password is not nil" do
      @user3.change_password(@user_password, nil, nil)
      @user3.valid?.should eq false
      @user3.errors.fetch(:new_password).nil?.should eq false
      expect {
        @user3.save(raise_on_failure: true)
      }.to raise_exception(Sequel::ValidationFailed, "new_password can't be blank")
    end
  end

  describe "when user is signed up with google sign-in and don't have any password yet" do
    before(:each) do
      @user.google_sign_in = true
      @user.last_password_change_date = nil
      @user.save

      @user.needs_password_confirmation?.should == false

      new_valid_password = '000123456'
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
      # PG12_DEPRECATED
      if @database.table_exists?('raster_overviews')
        user.in_database(as: :superuser).fetch(%{
          SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                            '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.raster_overviews', 'SELECT');
        }).first[:has_table_privilege].should == true
      end
      # PG12_DEPRECATED
      if @database.table_exists?('raster_columns')
        user.in_database(as: :superuser).fetch(%{
          SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                            '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.raster_columns', 'SELECT');
        }).first[:has_table_privilege].should == true
      end

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
