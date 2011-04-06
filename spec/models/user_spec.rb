require 'spec_helper'

describe User do

  it "should have a crypted password" do
    user = create_user :email => 'admin@example.com', :password => 'admin123'
    user.crypted_password.should_not be_blank
    user.crypted_password.should_not == 'admin123'
  end

  it "should authenticate if given email and password are correct" do
    user = create_user :email => 'admin@example.com', :password => 'admin123'
    User.authenticate('admin@example.com', 'admin123').should == user
    User.authenticate('admin@example.com', 'admin321').should be_nil
    User.authenticate('', '').should be_nil
  end

  it "should have many tables" do
    user = create_user
    user.tables.should be_empty

    create_table :user_id => user.id, :name => 'My first table', :privacy => Table::PUBLIC

    user.reload
    user.tables_count.should == 1
    user.tables.all.should == [Table.first(:user_id => user.id)]
  end

  it "should has his own database, created when the account is created" do
    user = create_user
    user.database_name.should == "cartodb_test_user_#{user.id}_db"
    user.database_username.should == "test_cartodb_user_#{user.id}"
    user.in_database do |user_database|
      user_database.test_connection.should == true
    end
  end

  it "should create a dabase user that only can read it's own database" do
    user1 = create_user
    user2 = create_user

    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user1.database_name, :logger => ::Rails.logger,
        'username' => user1.database_username, 'password' => user1.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = nil
    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user2.database_name, :logger => ::Rails.logger,
        'username' => user1.database_username, 'password' => user1.database_password
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
        'database' => user2.database_name, :logger => ::Rails.logger,
        'username' => user2.database_username, 'password' => user2.database_password
      )
    )
    connection.test_connection.should == true
    connection.disconnect

    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user1.database_name, :logger => ::Rails.logger,
        'username' => user2.database_username, 'password' => user2.database_password
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
    user = create_user
    table = new_table :name => 'antantaric species'
    table.user_id = user.id
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save

    query_result = user.run_query("select * from antantaric_species where family='Polynoidae' limit 10")
    query_result[:time].should_not be_blank
    query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    query_result[:total_rows].should == 2
    # TODO
    # query_result[:columns].should ==  [
    #   [:cartodb_id, "number"], [:id, "number"], [:name_of_species, "string"], [:kingdom, "string"], [:family, "string"],
    #   [:lat, "number", "latitude"], [:lon, "number", "longitude"], [:views, "number"], [:created_at, "date"], [:updated_at, "date"]
    # ]
    query_result[:rows][0][:name_of_species].should == "Barrukia cristata"
    query_result[:rows][1][:name_of_species].should == "Eulagisca gigantea"

    query_result = user.run_query("update antantaric_species set family='polynoidae' where family='Polynoidae'")
    query_result = user.run_query("select * from antantaric_species where family='Polynoidae' limit 10")
    query_result[:total_rows].should == 0
    query_result = user.run_query("select * from antantaric_species where family='polynoidae' limit 10")
    query_result[:total_rows].should == 2

    table2 = new_table :name => 'twitts'
    table2.user_id = user.id
    table2.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/twitters.csv", "text/csv")
    table2.save

    # query_result = user.run_query("select antantaric_species.family as fam, twitts.login as login from antantaric_species, twitts where family='Polynoidae' limit 10")
    # query_result[:total_rows].should == 10
    # query_result[:columns].should == [:fam, :login]
    # query_result[:columns].should ==  [
    #   [:fam, "text"], [:login, "text"]
    # ]
    #
    # query_result[:rows][0].should == { :fam=>"Polynoidae", :login=>"vzlaturistica " }
    #
    # query_result = user.run_query("select count(*) from antantaric_species where family='Polynoidae' ")
    # query_result[:time].should_not be_blank
    # query_result[:time].to_s.match(/^\d+\.\d+$/).should be_true
    # query_result[:total_rows].should == 1
    # query_result[:columns].should ==  [
    #   [:count, "number"]
    # ]
    # query_result[:rows][0].should == {:count => 2}
  end

  it "should raise errors when running invalid queries against his database" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.name = 'antantaric species'
    table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    table.save

    lambda {
      user.run_query("selectttt * from antantaric_species where family='Polynoidae' limit 10")
    }.should raise_error(CartoDB::ErrorRunningQuery)
  end

  it "can have different keys for accessing via JSONP API requests" do
    user = create_user
    lambda {
      user.create_key ""
    }.should raise_error
    key = user.create_key "mymashup.com"
    api_key = APIKey.filter(:user_id => user.id, :domain => 'http://mymashup.com').first
    api_key.api_key.should == key.api_key
  end

  it "should only be accessed by the public user if its status is public" do
    user = create_user
    table = new_table
    table.user_id = user.id
    table.force_schema = "name varchar, age integer"
    table.save
    table.should be_private

    lambda {
      user.in_database(:as => :public_user) do |user_database|
        user_database.run("select * from #{table.name}")
      end
    }.should raise_error(Sequel::DatabaseError)

    table.privacy = "PUBLIC"
    table.save
    table.reload

    user.in_database(:as => :public_user) do |user_database|
      user_database.run("select * from #{table.name}")
    end
  end

  it "should create a client_application for each user" do
    user = create_user
    user.client_application.should_not be_nil
  end

  it "should reset its client application" do
    user = create_user
    old_key = user.client_application.key

    user.reset_client_application!
    user.reload

    user.client_application.key.should_not == old_key
  end

end
