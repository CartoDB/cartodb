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

    user.tables_count.should == 1
    user.tables.all.should == [Table.first(:user_id => user.id)]
  end

  it "should has his own database, created when the account is created" do
    user = create_user
    user.database_name.should == "cartodb_test_user_#{user.id}_db"
    user.database_username.should == "cartodb_user_#{user.id}"
    user.in_database do |user_database|
      user_database.test_connection.should == true
    end
  end

  pending "should create a dabase user that only can read it's own database" do
    user1 = create_user
    user2 = create_user

    ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user1.database_name, :logger => ::Rails.logger,
        'username' => user1.database_username, 'password' => user1.database_password
      )
    ).test_connection.should == true

    ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user2.database_name, :logger => ::Rails.logger,
        'username' => user1.database_username, 'password' => user1.database_password
      )
    ).test_connection.should_not == true

    ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user2.database_name, :logger => ::Rails.logger,
        'username' => user2.database_username, 'password' => user2.database_password
      )
    ).test_connection.should == true

    ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => user1.database_name, :logger => ::Rails.logger,
        'username' => user2.database_username, 'password' => user2.database_password
      )
    ).test_connection.should_not == true
  end
end
