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
    user.in_database do |user_database|
      user_database.test_connection.should == true
      user_database.tables.should be_empty
    end
  end
end
