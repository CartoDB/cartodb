# coding: UTF-8
require_relative '../spec_helper'

describe User do
  before(:all) do
    puts "\n[rspec][user_spec] Creating test user databases..."
    @user     = create_user :email => 'admin@example.com', :username => 'admin', :password => 'admin123'
    @user2    = create_user :email => 'user@example.com',  :username => 'user',  :password => 'user123'

    puts "[rspec][user_spec] Loading user data..."
    reload_user_data(@user) && @user.reload

    puts "[rspec][user_spec] Running..."
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    User.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  after(:all) do
    @user.destroy
    @user2.destroy
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
    response_user = User.authenticate('admin@example.com', 'admin123')
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    User.authenticate('admin@example.com', 'admin321').should be_nil
    User.authenticate('', '').should be_nil
  end

  it "should authenticate with case-insensitive email and username" do
    response_user = User.authenticate('admin@example.com', 'admin123')
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    response_user_2 = User.authenticate('aDMin@eXaMpLe.Com', 'admin123')
    response_user_2.id.should eq @user.id
    response_user_2.email.should eq @user.email

    response_user_3 = User.authenticate('admin', 'admin123')
    response_user_3.id.should eq @user.id
    response_user_3.email.should eq @user.email

    response_user_4 = User.authenticate('ADMIN', 'admin123')
    response_user_4.id.should eq @user.id
    response_user_4.email.should eq @user.email
  end

  it "should only allow legal usernames" do
    illegal_usernames = %w(si$mon 'sergio estella' j@vi sergio£££ simon_tokumine SIMON Simon)
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
    organization = create_org('testusername', 10.megabytes, 1)
    @user.username = 'testusername'
    @user.valid?.should be_false
    @user.username = 'wadus'
    @user.valid?.should be_true
  end

  describe 'organization checks' do
    it "should not be valid if his organization doesn't have more seats" do

      organization = create_org('testorg', 10.megabytes, 1)
      user1 = create_user email: 'user1@testorg.com', username: 'user1', password: 'user1'
      user1.organization = organization
      user1.save
      organization.owner_id = user1.id
      organization.save
      organization.reload
      user1.reload

      # Don't remove this line or the spec will fail (magic):
      puts "Organization users: #{organization.users.count}"

      user2 = new_user
      user2.organization = organization
      user2.valid?.should be_false
      user2.errors.keys.should include(:organization)

      organization.destroy
      user1.destroy
    end

    it 'should be valid if his organization has enough seats' do
      organization = create_org('testorg', 10.megabytes, 1)
      user = User.new
      user.organization = organization
      user.valid?
      user.errors.keys.should_not include(:organization)
      organization.destroy
    end

    it "should not be valid if his organization doesn't have enough disk space" do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(10.megabytes)
      user = User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?.should be_false
      user.errors.keys.should include(:quota_in_bytes)
      organization.destroy
    end

    it 'should be valid if his organization has enough disk space' do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(9.megabytes)
      user = User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?
      user.errors.keys.should_not include(:quota_in_bytes)
      organization.destroy
    end

    it 'should set account_type properly' do
      organization = FactoryGirl.create(:organization_with_users)
      organization.users.reject(&:organization_owner?).each do |u|
        u.account_type.should == "ORGANIZATION USER"
      end
      organization.destroy
    end

    it 'should set default settings properly unless overriden' do
      organization = FactoryGirl.create(:organization_with_users)
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

    it "should return proper values for non-persisted settings" do
      organization = FactoryGirl.create(:organization_with_users)
      organization.users.reject(&:organization_owner?).each do |u|
        u.dedicated_support?.should be_true
        u.remove_logo?.should be_true
        u.private_maps_enabled?.should be_true
        u.import_quota.should == 3
      end
      organization.destroy
    end
  end

  describe 'central synchronization' do
    it 'should create remote user in central if needed' do
      pending "Central API credentials not provided" unless User.new.sync_data_with_cartodb_central?
      organization = create_org('testorg', 500.megabytes, 1)
      user = create_user email: 'user1@testorg.com', username: 'user1', password: 'user1'
      user.organization = organization
      user.save
      Cartodb::Central.any_instance.expects(:create_organization_user).with(organization.name, user.allowed_attributes_to_central(:create)).once
      user.create_in_central.should be_true
    end
    it 'should update remote user in central if needed' do
      pending
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
    user.valid?.should be_true

    user.destroy
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
    @user.expects(:rebuild_quota_trigger).once
    @user.quota_in_bytes = @user.quota_in_bytes + 1.megabytes
    @user.save
  end

  it "should read api calls from external service" do
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
    it "should load a cartodb avatar url" do
      user1 = create_user(email: 'ewdewfref34r43r43d32f45g5@example.com', username: 'u1', password: 'foobar')
      avatar_kind = Cartodb.config[:avatars]['kinds'][0]
      avatar_color = Cartodb.config[:avatars]['colors'][0]
      avatar_base_url = Cartodb.config[:avatars]['base_url']
      Random.any_instance.stubs(:rand).returns(0)
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 404))
      user1.avatar_url = nil
      user1.save
      user1.reload_avatar
      user1.avatar_url.should == "//#{avatar_base_url}/avatar_#{avatar_kind}_#{avatar_color}.png" 
      user1.destroy
    end
    it "should load a the user gravatar url" do
      user1 = create_user(email: 'ewdewfref34r43r43d32f45g5@example.com', username: 'u1', password: 'foobar')
      gravatar_url = %r{gravatar.com}
      Typhoeus.stub(gravatar_url, { method: :get }).and_return(Typhoeus::Response.new(code: 200))
      user1.reload_avatar
      user1.avatar_url.should == "//#{user1.gravatar_user_url}"
      user1.destroy
    end
  end
  
  describe '#overquota' do
    it "should return users over their map view quota, excluding organization users" do
      User.overquota.should be_empty
      User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      User.any_instance.stubs(:map_view_quota).returns 10
      User.overquota.map(&:id).should include(@user.id)
      User.overquota.size.should == User.reject{|u| u.organization_id.present? }.count
    end

    it "should return users near their map view quota" do
      User.any_instance.stubs(:get_api_calls).returns([81])
      User.any_instance.stubs(:map_view_quota).returns(100)
      User.overquota.should be_empty
      User.overquota(0.20).map(&:id).should include(@user.id)
      User.overquota(0.20).size.should == User.reject{|u| u.organization_id.present? }.count
      User.overquota(0.10).should be_empty
    end

    it "should return users near their geocoding quota" do
      User.any_instance.stubs(:get_api_calls).returns([0])
      User.any_instance.stubs(:map_view_quota).returns(120)
      User.any_instance.stubs(:get_geocoding_calls).returns(81)
      User.any_instance.stubs(:geocoding_quota).returns(100)
      User.overquota.should be_empty
      User.overquota(0.20).map(&:id).should include(@user.id)
      User.overquota(0.20).size.should == User.reject{|u| u.organization_id.present? }.count
      User.overquota(0.10).should be_empty
    end

    it "should not return organization users" do
      User.any_instance.stubs(:organization_id).returns("organization-id")
      User.any_instance.stubs(:organization).returns(Organization.new)
      User.overquota.should be_empty
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

  it "should have many tables" do
    @user2.tables.should be_empty
    create_table :user_id => @user2.id, :name => 'My first table', :privacy => Table::PRIVACY_PUBLIC
    @user2.reload
    @user2.tables.all.should == [Table.first(:user_id => @user2.id)]
  end

  it "should generate a data report"

  it "should update remaining quotas when adding or removing tables" do
    initial_quota = @user2.remaining_quota

    expect { create_table :user_id => @user2.id, :privacy => Table::PRIVACY_PUBLIC }
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
    query_result = @user.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows].first.keys.should == [:id, :name_of_species, :kingdom, :family, :lat, :lon, :views, :the_geom, :cartodb_id, :created_at, :updated_at, :the_geom_webmercator]
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"

    # update and reselect
    query_result = @user.run_pg_query("update import_csv_1 set family='polynoidae' where family='Polynoidae'")
    query_result = @user.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0

    # check counts
    query_result = @user.run_pg_query("select * from import_csv_1 where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2

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

  it "should raise errors when running invalid queries against his database" do
    lambda {
      @user.run_pg_query("selectttt * from import_csv_1 where family='Polynoidae' limit 10")
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

    query_result = @user.run_pg_query("select * from import_csv_1 where family='Polynoidae' limit 1; select * from import_csv_1 where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"
  end

  it "should allow multiple queries in the format: insert_query; select_query" do
    query_result = @user.run_pg_query("insert into import_csv_1 (name_of_species,family) values ('cristata barrukia','Polynoidae'); select * from import_csv_1 where family='Polynoidae' ORDER BY name_of_species ASC limit 10")
    query_result[:total_rows].should == 3
    query_result[:rows].map { |i| i[:name_of_species] }.should =~ ["Barrukia cristata", "Eulagisca gigantea", "cristata barrukia"]
  end

  it "should fail with error if table doesn't exist" do
    reload_user_data(@user) && @user.reload
    lambda {
      @user.run_pg_query("select * from wadus")
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
    create_table :user_id => doomed_user.id, :name => 'My first table', :privacy => Table::PRIVACY_PUBLIC
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
    uuid      = Table.where(id: table_id).first.table_visualization.id

    CartoDB::Varnish.any_instance.expects(:purge)
      .with("#{doomed_user.database_name}.*")
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with("^#{doomed_user.database_name}:(.*public\\.clubbing.*)|(table)$")
      .returns(true)
    CartoDB::Varnish.any_instance.expects(:purge)
      .with(".*#{uuid}:vizjson")
      .times(2)
      .returns(true)
    Table.any_instance.expects(:delete_tile_style).returns(true)

    doomed_user.destroy

    DataImport.where(:user_id => doomed_user.id).count.should == 0
    Table.where(:user_id => doomed_user.id).count.should == 0
    Layer.db["SELECT * from layers_users WHERE user_id = '#{doomed_user.id}'"].count.should == 0
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
    user.destroy
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

  describe '#shared_tables' do
    it 'Checks that shared tables include not only owned ones' do
      require_relative '../../app/models/visualization/collection'
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)
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


      pending "Until User organization is stabilized, cannot properly delete stuff"

      # Remove non-admin first
      u2.destroy

      u1.reload
      org.reload
      org.users.count.should eq 1

      # And now we can destroy the owner
      u1.destroy

      org.reload
      org.users.count.should eq 0
    end
  end

  it "should notify a new user created from a organization" do
   
    ::Resque.stubs(:enqueue).returns(nil)

    organization = FactoryGirl.create(:organization_with_users)
    user1 = new_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    user1.organization = organization
    user1.id = UUIDTools::UUID.timestamp_create.to_s

    ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser, user1.id).once
    
    user1.save

    organization.destroy
    #user1.destroy
    #organization.users.each {|u| u.destroy unless u == organization.owner }
    #organization.owner.destroy
  end

  def create_org(org_name, org_quota, org_seats)
    organization = Organization.new
    organization.name = org_name
    organization.quota_in_bytes = org_quota
    organization.seats = org_seats
    organization.save!
    organization
  end

end

