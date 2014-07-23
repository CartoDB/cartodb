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
    puts $pool.all.keys
    puts "*** POOL END"
  end

  it "it should return a broken connection" do
    user1 = create_user(username: 'test1', email: "client@example.com", password: "clientex")
   
    puts "*** BEFORE START ***"
    show_pool
    show_connections(user1)
    puts "*** BEFORE END ***"
    # This will make the pooler to think that the connections is working fine
    Sequel::Postgres::Database.any_instance.stubs(:get).with(1).returns(0)
    User.terminate_database_connections(user1.database_name, user1.database_host)     
    puts "*** AFTER START ***"
    show_pool
    show_connections(user1)
    puts "*** AFTER END ***"
    
    expect { 
      puts "*** QUERY START"
      begin
        sleep 10
        tables = user1.real_tables
        puts "###### #{tables}"
        puts "**** OK query"
      rescue => e
        puts "**** FAIL query"
        puts e
        raise e
      end
      puts "*** QUERY END"
    }.to raise_error(Sequel::DatabaseDisconnectError)
    
    user1.destroy
  end

  it "it should return a working connection" do
    user2 = create_user(username: 'test2', email: "client@example.com", password: "clientex")

    table_name = 'foobar'
    
    user2.in_database do |database|
      database.run("CREATE TABLE #{table_name} (id integer)")
    end

    puts "*** BEFORE START ***"
    show_pool
    show_connections(user2)
    puts "*** BEFORE END ***"
    User.terminate_database_connections(user2.database_name, user2.database_host)     
    puts "*** AFTER START ***"
    show_pool
    show_connections(user2)
    puts "*** AFTER END ***"
  
    puts "*** QUERY START"
    tables = user2.real_tables
    puts "*** QUERY END"
    tables.should be_an_instance_of Array
    tables.length.should == 1
    tables.first[:relname].should == table_name

    user2.destroy
  end
end
