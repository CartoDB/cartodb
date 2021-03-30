require_relative '../spec_helper'
require 'helpers/user_part_helper'
require 'factories/organizations_contexts'
require 'helpers/account_types_helper'
require 'factories/database_configuration_contexts'

describe User do
  include UserPartHelper
  include AccountTypesHelper
  include_context 'user spec configuration'

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

  it "should has their own database, created when the account is created" do
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
    rescue StandardError
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
    rescue StandardError
      true.should be_true
    ensure
      connection.disconnect
    end
  end

  it "should run valid queries against their database" do
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

  it "should raise errors when running invalid queries against their database" do
    lambda {
      @user.db_service.run_pg_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "should run valid queries against their database in pg mode" do
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

  it "should raise errors when running invalid queries against their database in pg mode" do
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

  it "should invalidate all their vizjsons when their account type changes" do
    @account_type = create_account_type_fg('WADUS')
    @user.account_type = 'WADUS'
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{@user.database_name}.*:vizjson").times(1).returns(true)
    @user.save
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
    user = create :user
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
    user = create :user, user_timeout: 200002, database_timeout: 100002
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
    user = create :user, user_render_timeout: 200003, database_render_timeout: 100003
    user.reload
    user.user_render_timeout.should == 200003
    user.database_render_timeout.should == 100003
    $users_metadata.HGET(user.timeout_key, 'render').should == '200003'
    $users_metadata.HGET(user.timeout_key, 'render_public').should == '100003'
    user.destroy
  end

  it "should have valid non-zero db timeout limits by default" do
    user = create :user
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
    user = create :user
    user.user_render_timeout.should eq 0
    user.database_render_timeout.should eq 0
    $users_metadata.HGET(user.timeout_key, 'render').should eq '0'
    $users_metadata.HGET(user.timeout_key, 'render_public').should eq '0'
    user.destroy
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
    CartoDB::Varnish.any_instance.expects(:purge).with("#{doomed_user.database_name}.*").at_least(2).returns(true)

    doomed_user.destroy
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
      if user.in_database(as: :superuser).table_exists?('raster_overviews')
        user.in_database(as: :superuser).fetch(%{
          SELECT * FROM has_table_privilege('#{CartoDB::PUBLIC_DB_USER}',
                                            '#{CartoDB::UserModule::DBService::SCHEMA_PUBLIC}.raster_overviews', 'SELECT');
        }).first[:has_table_privilege].should == true
      end
      # PG12_DEPRECATED
      if user.in_database(as: :superuser).table_exists?('raster_columns')
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

  describe 'ghost tables event trigger' do
    before(:all) do
      CartoDB::UserModule::DBService.any_instance.unstub(:create_ghost_tables_event_trigger)
      @ghost_tables_user = create_user
    end

    after(:all) do
      @ghost_tables_user.destroy
      CartoDB::UserModule::DBService.any_instance.stubs(:create_ghost_tables_event_trigger)
    end

    it 'creates the cdb_ddl_execution table with the user' do
      table_name = @ghost_tables_user.in_database(as: :superuser)
                                     .fetch("SELECT to_regclass('cartodb.cdb_ddl_execution');")
                                     .first[:to_regclass]
      table_name.should eql 'cdb_ddl_execution'
    end

    it 'removes the cdb_ddl_execution table when calling drop_ghost_tables_event_trigger' do
      @ghost_tables_user.db_service.drop_ghost_tables_event_trigger

      table_name = @ghost_tables_user.in_database(as: :superuser)
                                     .fetch("SELECT to_regclass('cartodb.cdb_ddl_execution');")
                                     .first[:to_regclass]
      table_name.should be_nil

      @ghost_tables_user.db_service.create_ghost_tables_event_trigger
    end

    it 'saves the TIS config from app_config.yml to cdb_conf' do
      cdb_conf = @ghost_tables_user.in_database(as: :superuser)
                                   .fetch("SELECT cartodb.CDB_Conf_GetConf('invalidation_service')")
                                   .first[:cdb_conf_getconf]
      cdb_conf.should be
    end
  end
end
