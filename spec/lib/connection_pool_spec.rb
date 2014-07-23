# coding: UTF-8

require 'spec_helper'

describe CartoDB::ConnectionPool do

  def show_connections(user)
    connection_params = ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
      'host' => user.database_host,
      'database' => 'postgres'
    ) {|key, o, n| n.nil? ? o : n}
    conn = ::Sequel.connect(connection_params)
    puts "*** CONN START"
    conn.fetch("SELECT datname,usename,pid from pg_stat_activity").all.each do |r|
      puts r
    end
    puts "*** CONN END"
    conn.disconnect
  end

  def show_pool
    puts "*** POOL START"
    puts $pool.inspect
    puts "*** POOL END"
  end

  it "it should return a broken connection" do
    user = create_user(username: 'test', email: "client@example.com", password: "clientex")
   
    puts "*** BEFORE START ***"
    show_pool
    show_connections(user)
    puts "*** BEFORE END ***"
    # This will make the pooler to think that the connections is working fine
    Sequel::Postgres::Database.any_instance.stubs(:get).with(1).returns([])
    User.terminate_database_connections(user.database_name, user.database_host)     
    puts "*** AFTER START ***"
    show_pool
    show_connections(user)
    puts "*** AFTER END ***"
    
    expect { 
      puts user.real_tables
    }.to raise_error(Sequel::DatabaseDisconnectError)
    
    user.destroy
  end

  it "it should return a working connection" do
    user = create_user(username: 'test', email: "client@example.com", password: "clientex")

    table_name = 'foobar'
    
    user.in_database do |database|
      database.run("CREATE TABLE #{table_name} (id integer)")
    end

    puts "*** BEFORE START ***"
    show_pool
    show_connections(user)
    puts "*** BEFORE END ***"
    User.terminate_database_connections(user.database_name, user.database_host)     
    puts "*** AFTER START ***"
    show_pool
    show_connections(user)
    puts "*** AFTER END ***"
  
    tables = user.real_tables
    tables.should be_an_instance_of Array
    tables.length.should == 1
    tables.first[:relname].should == table_name

    user.destroy
  end
end
