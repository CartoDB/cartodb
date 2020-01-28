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


  describe "organization user deletion" do

    it "should transfer tweet imports to owner" do

      # avoid: Key (account_type)=(ORGANIZATION USER) is not present in table "account_types"
      org = create_organization_with_users
      org.destroy

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
    CartoDB::Varnish.any_instance.expects(:purge).with("#{doomed_user.database_name}.*").at_least(2).returns(true)

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
                    .at_least(1)
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
    @user.stubs(:upgraded_at).returns(Time.now - (::User::MAGELLAN_TRIAL_DAYS - 1).days)
    @user.trial_ends_at.should_not be_nil
    @user.stubs(:account_type).returns('PERSONAL30')
    @user.trial_ends_at.should_not be_nil
    @user.stubs(:account_type).returns('Individual')
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

        it 'deletes client_application and friends' do
          user = create_user(email: 'clientapp@example.com', username: 'clientapp', password: @user_password)

          user.create_client_application
          user.client_application.access_tokens << ::AccessToken.new(
            token: "access_token",
            secret: "access_secret",
            callback_url: "http://callback2",
            verifier: "v2",
            scope: nil,
            client_application_id: user.client_application.id
          ).save

          user.client_application.oauth_tokens << ::OauthToken.new(
            token: "oauth_token",
            secret: "oauth_secret",
            callback_url: "http//callback.com",
            verifier: "v1",
            scope: nil,
            client_application_id: user.client_application.id
          ).save

          base_key = "rails:oauth_access_tokens:#{user.client_application.access_tokens.first.token}"

          client_application = ClientApplication.where(user_id: user.id).first
          expect(ClientApplication.where(user_id: user.id).count).to eq 2
          expect(client_application.tokens).to_not be_empty
          expect(client_application.tokens.length).to eq 2
          $api_credentials.keys.should include(base_key)

          user.destroy

          expect(ClientApplication.where(user_id: user.id).first).to be_nil
          expect(AccessToken.where(user_id: user.id).first).to be_nil
          expect(OauthToken.where(user_id: user.id).first).to be_nil
          $api_credentials.keys.should_not include(base_key)
        end

        it 'deletes oauth_apps and friends' do
          owner_oauth_app = create_user(email: 'owner@example.com', username: 'oauthappowner', password: @user_password)
          user = create_user(email: 'oauth@example.com', username: 'oauthapp', password: @user_password)

          oauth_app = FactoryGirl.create(:oauth_app, user_id: owner_oauth_app.id)
          oauth_app_user = oauth_app.oauth_app_users.create!(user_id: user.id)
          oac = oauth_app_user.oauth_authorization_codes.create!(scopes: ['offline'])
          access_token, refresh_token = oac.exchange!

          app = Carto::OauthApp.where(user_id: owner_oauth_app.id).first
          users = app.oauth_app_users
          o_user = users.first
          refresh_token = Carto::OauthRefreshToken.where(oauth_app_user_id: o_user.id).first
          access_token = Carto::OauthAccessToken.where(oauth_app_user_id: o_user.id).first
          api_keys = Carto::ApiKey.where(user_id: user.id, type: 'oauth').all
          expect(users.count).to eq 1
          expect(refresh_token).to eq refresh_token
          expect(access_token).to eq access_token
          expect(api_keys.count).to eq 1

          expect(user.destroy).to be_true

          app = Carto::OauthApp.where(user_id: user.id).first
          users = Carto::OauthAppUser.where(user_id: user.id, oauth_app: oauth_app.id).first
          refresh_token = Carto::OauthRefreshToken.where(oauth_app_user_id: oauth_app_user.id).first
          access_token = Carto::OauthAccessToken.where(oauth_app_user_id: oauth_app_user.id).first
          api_key = Carto::ApiKey.where(user_id: user.id, type: 'oauth').first
          expect(app).to be_nil
          expect(users).to be_nil
          expect(refresh_token).to be_nil
          expect(access_token).to be_nil
          expect(api_key).to be_nil
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
