# coding: UTF-8
require 'spec_helper'

describe User do
  before(:all) do
    puts "\n[rspec][user_spec] Creating test user databases..."
    @new_user = new_user
    @user     = create_user :email => 'admin@example.com', :username => 'admin', :password => 'admin123'
    @user2    = create_user :email => 'user@example.com',  :username => 'user',  :password => 'user123'

    puts "[rspec][user_spec] Loading user data..."
    reload_user_data(@user) && @user.reload

    puts "[rspec][user_spec] Running..."
  end

  before(:each) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
  end

  it "should set up a user after create" do
    @new_user.save
    @new_user.reload
    @new_user.should_not be_new
    @new_user.database_name.should_not be_nil
    @new_user.in_database.test_connection.should == true
  end

  it "should have a crypted password" do
    @user.crypted_password.should_not be_blank
    @user.crypted_password.should_not == 'admin123'
  end

  it "should authenticate if given email and password are correct" do
    User.authenticate('admin@example.com', 'admin123').should == @user
    User.authenticate('admin@example.com', 'admin321').should be_nil
    User.authenticate('', '').should be_nil
  end

  it "should authenticate with case-insensitive email and username" do
    User.authenticate('admin@example.com', 'admin123').should == @user
    User.authenticate('aDMin@eXaMpLe.Com', 'admin123').should == @user
    User.authenticate('admin', 'admin123').should == @user
    User.authenticate('ADMIN', 'admin123').should == @user
  end

  it "should only allow legal usernames" do
    illegal_usernames = %w(si$mon 'sergio estella' j@vi sergio£££ simon_tokumine simon.tokumine SIMON Simon)
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
  
  it "should have a default dashboard_viewed? false" do
    user = User.new
    user.dashboard_viewed?.should be_false
  end 

  it "should reset dashboard_viewed when dashboard gets viewed" do
    user = User.new
    user.view_dashboard
    user.dashboard_viewed?.should be_true
  end

  it "should validate that password is present if record is new and crypted_password or salt are blank" do
    user = User.new
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
    user_check = User[user.id]
    user_check.crypted_password.should == another_user.crypted_password
    user_check.salt.should == another_user.salt

    user.password = nil
    user.password_confirmation = nil
    user.valid?.should be_true
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

  it "should read api calls from external service" do
    @user.stubs(:get_old_api_calls).returns({
      "per_day" => [0, 0, 0, 0, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0], 
      "total"=>49, 
      "updated_at"=>1370362756
    })
    @user.get_api_calls.should == [0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0]
    @user.get_api_calls(
      from: (Date.today - 6.days), 
      to: Date.today
    ).should == [0, 0, 0, 0, 0, 17, 0]
  end

  describe '#overquota' do
    it "should return users over their map view quota" do
      User.overquota.should be_empty
      User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      User.any_instance.stubs(:map_view_quota).returns 10
      User.overquota.should include(@user)
      User.overquota.size.should == User.count
    end

    it "should return users near their map view quota" do
      User.any_instance.stubs(:get_api_calls).returns([81])
      User.any_instance.stubs(:map_view_quota).returns(100)
      User.overquota.should be_empty
      User.overquota(0.20).should include(@user)
      User.overquota(0.20).size.should == User.count
      User.overquota(0.10).should be_empty
    end
    
    it "should return users near their geocoding quota" do
      User.any_instance.stubs(:get_api_calls).returns([0])
      User.any_instance.stubs(:map_view_quota).returns(120)
      User.any_instance.stubs(:get_geocoding_calls).returns(81)
      User.any_instance.stubs(:geocoding_quota).returns(100)
      User.overquota.should be_empty
      User.overquota(0.20).should include(@user)
      User.overquota(0.20).size.should == User.count
      User.overquota(0.10).should be_empty
    end
  
  end

  describe '#get_geocoding_calls' do
    before do
      delete_user_data @user
      @user.stubs(:last_billing_cycle).returns(Date.today)
      FactoryGirl.create(:geocoding, user: @user, created_at: Time.now, processed_rows: 1)
      FactoryGirl.create(:geocoding, user: @user, created_at: Time.now - 5.days, processed_rows: 2)
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

  it "should have many tables" do
    @user2.tables.should be_empty
    create_table :user_id => @user2.id, :name => 'My first table', :privacy => Table::PUBLIC
    @user2.reload
    @user2.tables.all.should == [Table.first(:user_id => @user2.id)]
  end

  it "should generate a data report"

  it "should update remaining quotas when adding or removing tables" do
    initial_quota = @user2.remaining_quota

    expect { create_table :user_id => @user2.id, :privacy => Table::PUBLIC }
      .to change { @user2.remaining_table_quota }.by(-1)

    table = Table.filter(:user_id => @user2.id).first
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
    query_result = @user.run_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows].first.keys.should == [:id, :name_of_species, :kingdom, :family, :lat, :lon, :views, :the_geom, :cartodb_id, :created_at, :updated_at, :the_geom_webmercator]
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"

    # update and reselect
    query_result = @user.run_query("update import_csv_1 set family='polynoidae' where family='Polynoidae'")
    query_result = @user.run_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0

    # check counts
    query_result = @user.run_query("select * from import_csv_1 where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2

    # test a product
    query_result = @user.run_query("select import_csv_1.family as fam, twitters.login as login from import_csv_1, twitters where family='polynoidae' limit 10")
    query_result[:total_rows].should == 10
    query_result[:rows].first.keys.should == [:fam, :login]
    query_result[:rows][0].should == { :fam=>"polynoidae", :login=>"vzlaturistica " }

    # test counts
    query_result = @user.run_query("select count(*) from import_csv_1 where family='polynoidae' ")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 1
    query_result[:rows].first.keys.should ==  [:count]
    query_result[:rows][0].should == {:count => 2}
  end

  it "should raise errors when running invalid queries against his database" do
    lambda {
      @user.run_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "should run valid queries against his database in pg mode" do
    reload_user_data(@user) && @user.reload

    # initial select tests
    # tests results and modified flags
    query_result = @user.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows].first.keys.should == [:id, :name_of_species, :kingdom, :family, :lat, :lon, :views, :the_geom, :cartodb_id, :created_at, :updated_at, :the_geom_webmercator]
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"
    query_result[:results].should  == true
    query_result[:modified].should == false

    # update and reselect
    query_result = @user.run_pg_query("update import_csv_1 set family='polynoidae' where family='Polynoidae'")
    query_result[:modified].should   == true
    query_result[:results].should    == false

    query_result = @user.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0
    query_result[:modified].should   == false
    query_result[:results].should    == true

    # # check counts
    query_result = @user.run_pg_query("select * from import_csv_1 where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2
    query_result[:results].should    == true

    # test a product
    query_result = @user.run_pg_query("select import_csv_1.family as fam, twitters.login as login from import_csv_1, twitters where family='polynoidae' limit 10")
    query_result[:total_rows].should == 10
    query_result[:rows].first.keys.should == [:fam, :login]
    query_result[:rows][0].should == { :fam=>"polynoidae", :login=>"vzlaturistica " }

    # test counts
    query_result = @user.run_pg_query("select count(*) from import_csv_1 where family='polynoidae' ")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 1
    query_result[:rows].first.keys.should ==  [:count]
    query_result[:rows][0].should == {:count => 2}
  end

  it "should raise errors when running invalid queries against his database in pg mode" do
    lambda {
      @user.run_pg_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "should raise errors when invalid table name used in pg mode" do
    lambda {
      @user.run_pg_query("select * from this_table_is_not_here where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::TableNotExists)
  end

  it "should raise errors when invalid column used in pg mode" do
    lambda {
      @user.run_pg_query("select not_a_col from import_csv_1 where family='Polynoidae' limit 10")
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

    query_result = @user.run_query("select * from import_csv_1 where family='Polynoidae' limit 1; select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"
  end

  it "should allow multiple queries in the format: insert_query; select_query" do
    query_result = @user.run_query("insert into import_csv_1 (name_of_species,family) values ('cristata barrukia','Polynoidae'); select * from import_csv_1 where family='Polynoidae' ORDER BY name_of_species ASC limit 10")
    query_result[:total_rows].should == 3
    query_result[:rows].map { |i| i[:name_of_species] }.should =~ ["Barrukia cristata", "Eulagisca gigantea", "cristata barrukia"]
  end

  it "should fail with error if table doesn't exist" do
    reload_user_data(@user) && @user.reload
    lambda {
      @user.run_query("select * from wadus")
    }.should raise_error(CartoDB::TableNotExists)
  end

  it "should have a method that generates users redis users_metadata key" do
    @user.key.should == "rails:users:#{@user.username}"
  end

  it "should be able to store the users id and database name in redis" do
    @user.save_metadata.should be_true
    $users_metadata.HGET(@user.key, 'id').should == @user.id.to_s
    $users_metadata.HGET(@user.key, 'database_name').should == @user.database_name
  end

  it "should store its metadata automatically after creation" do
    $users_metadata.HGET(@user.key, 'id').should == @user.id.to_s
    $users_metadata.HGET(@user.key, 'database_name').should == @user.database_name
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
    create_table :user_id => doomed_user.id, :name => 'My first table', :privacy => Table::PUBLIC
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
    CartoDB::Varnish.any_instance.expects(:purge).with("obj.http.X-Cache-Channel ~ #{doomed_user.database_name}.*").returns(true)

    doomed_user.destroy
  end

  it "should remove its user tables, layers and data imports after deletion" do
    doomed_user = create_user :email => 'doomed2@example.com', :username => 'doomed2', :password => 'doomed123'
    data_import = DataImport.create(:user_id     => doomed_user.id,
                      :data_source => '/../db/fake_data/clubbing.csv').run_import!
    doomed_user.add_layer Layer.create(:kind => 'carto')
    table_id  = data_import.table_id
    uuid      = Table.where(id: table_id).first.table_visualization.id
    
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("obj.http.X-Cache-Channel ~ #{doomed_user.database_name}.*")
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("obj.http.X-Cache-Channel ~ ^#{doomed_user.database_name}:(.*clubbing.*)|(table)$")
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("obj.http.X-Cache-Channel ~ .*#{uuid}:vizjson")
      .times(2)
      .returns(true)
    Table.any_instance.expects(:delete_tile_style).returns(true)
    
    doomed_user.destroy

    DataImport.where(:user_id => doomed_user.id).count.should == 0
    Table.where(:user_id => doomed_user.id).count.should == 0
    Layer.db["SELECT * from layers_users WHERE user_id = #{doomed_user.id}"].count.should == 0
  end

  it "should correctly identify last billing cycle" do
    user = create_user :email => 'example@example.com', :username => 'example', :password => 'testingbilling'
    Timecop.freeze(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-15"))
      user.last_billing_cycle.should == Date.parse("2012-12-15")
    end
    Timecop.freeze(Date.parse("2013-01-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2012-12-02")
    end
    Timecop.freeze(Date.parse("2013-03-01")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-31"))
      user.last_billing_cycle.should == Date.parse("2013-02-28")
    end
    Timecop.freeze(Date.parse("2013-03-15")) do
      user.stubs(:period_end_date).returns(Date.parse("2012-12-02"))
      user.last_billing_cycle.should == Date.parse("2013-03-02")
    end
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
    @user.stubs(:upgraded_at).returns(Time.now - 15.days)
    @user.trial_ends_at.should_not be_nil
  end

  describe '#link_ghost_tables' do
    it "should correctly count real tables" do
    reload_user_data(@user) && @user.reload
      @user.in_database.run('create table ghost_table (test integer)')
      @user.real_tables.map { |c| c[:relname] }.should =~ ["ghost_table", "import_csv_1", "twitters"]
      @user.real_tables.size.should == 3
      @user.tables.count.should == 2
    end

    it "should link a table with null table_id" do
      reload_user_data(@user) && @user.reload
      table = create_table :user_id => @user.id, :name => 'My table'
      initial_count = @user.tables.count
      table_id = table.table_id
      table.this.update table_id: nil
      @user.link_ghost_tables
      table.reload
      table.table_id.should == table_id
      @user.tables.count.should == initial_count
    end

    it "should link a table with wrong table_id" do
      reload_user_data(@user) && @user.reload
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
      reload_user_data(@user) && @user.reload
      initial_count = @user.tables.count
      table = create_table :user_id => @user.id, :name => 'My table 3'
      @user.in_database.drop_table(table.name)
      @user.tables.where(name: table.name).first.should_not be_nil
      @user.link_ghost_tables
      @user.tables.where(name: table.name).first.should be_nil
      @user.tables.count.should == initial_count
    end

    it "should not do anything when real tables is blank" do
      reload_user_data(@user) && @user.reload
      @user.stubs(:real_tables).returns([])
      @user.tables.count.should_not == 0
      @user.link_ghost_tables
      @user.tables.count.should_not == 0
    end
  end

end
