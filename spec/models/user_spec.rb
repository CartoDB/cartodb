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
  
  it "should set up a user after create" do
    @new_user.save
    @new_user.reload
    @new_user.should_not be_new
    @new_user.in_database.test_connection.should == true
    @new_user.database_name.should_not be_nil
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

  it "should have many tables" do    
    @user2.tables.should be_empty
    create_table :user_id => @user2.id, :name => 'My first table', :privacy => Table::PUBLIC
    @user2.reload
    @user2.tables_count.should == 1
    @user2.tables.all.should == [Table.first(:user_id => @user2.id)]
  end

  it "should has his own database, created when the account is created" do    
    @user.database_name.should == "cartodb_test_user_#{@user.id}_db"
    @user.database_username.should == "test_cartodb_user_#{@user.id}"
    @user.in_database.test_connection.should == true
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
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "cristata barrukia"
    query_result[:rows][2][:name_of_species].should == "Eulagisca gigantea" 
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
  
  it "should store it's metadata automatically after creation" do    
    $users_metadata.HGET(@user.key, 'id').should == @user.id.to_s
    $users_metadata.HGET(@user.key, 'database_name').should == @user.database_name
  end  
end