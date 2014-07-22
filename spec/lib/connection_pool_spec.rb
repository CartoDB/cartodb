# coding: UTF-8

require 'spec_helper'

describe CartoDB::ConnectionPool do

  it "it should return a broken connection" do
    user = create_user(username: 'test', email: "client@example.com", password: "clientex")
    
    # This will make the pooler to think that the connections is working fine
    Sequel::Postgres::Database.any_instance.stubs(:fetch).with("SELECT 1").returns([])
    User.terminate_database_connections(user.database_name, user.database_host)     
   
    expect { 
      user.real_tables
    }.to raise_error(Sequel::DatabaseDisconnectError)
    
    user.destroy
  end

  it "it should return a working connection" do
    user = create_user(username: 'test', email: "client@example.com", password: "clientex")

    table_name = 'foobar'
    
    user.in_database do |database|
      database.run("CREATE TABLE #{table_name} (id integer)")
    end

    User.terminate_database_connections(user.database_name, user.database_host)     
  
    tables = user.real_tables
    tables.should be_an_instance_of Array
    tables.length.should == 1
    tables.first[:relname].should == table_name

    user.destroy
  end
end
