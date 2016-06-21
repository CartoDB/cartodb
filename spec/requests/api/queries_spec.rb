# encoding: utf-8
require_relative '../../acceptance_helper'

feature "API 1.0 queries management" do
  before(:all) do
    Capybara.current_driver = :rack_test
    @user = create_user({:username => 'test'})
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user
    @table = create_table :user_id => @user.id
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  scenario "Get the results of a SELECT query" do
    50.times do |i|
      @table.insert_row!({:name => "Row number #{i}", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[40.392949,-3.69084]\}}})
    end

    get_json api_queries_url(:sql => "SELECT * FROM #{@table.name} ORDER BY cartodb_id ASC LIMIT 10", :rows_per_page => 2) do |response|
      response.status.should be_success
      response.body[:rows].size.should == 2
      response.body[:rows][0]["name"].should == "Row number 0"
      response.body[:rows][1]["name"].should == "Row number 1"
    end
  end
  
  scenario "Get the results of a UPDATE query" do
    50.times do |i|
      @table.insert_row!({:name => "Row number #{i}", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[40.392949,-3.69084]\}}})
    end

    get_json api_queries_url(:sql => "UPDATE #{@table.name} SET description = NULL WHERE cartodb_id < 13", :rows_per_page => 2) do |response|
      response.status.should be_success
      response.body[:rows].size.should == 0
      response.body[:affected_rows].should == 12
    end
  end  

  scenario "Get the results of a DELETE query" do
    50.times do |i|
      @table.insert_row!({:name => "Row number #{i}", :description => String.random(50), :the_geom => %Q{\{"type":"Point","coordinates":[40.392949,-3.69084]\}}})
    end

    get_json api_queries_url(:sql => "DELETE FROM #{@table.name} WHERE cartodb_id < 13", :rows_per_page => 2) do |response|
      response.status.should be_success
      response.body[:rows].size.should == 0
      response.body[:affected_rows].should == 12
    end
  end  


  scenario "Get the results of a query involving system tables" do
    get_json api_queries_url(:sql => "SELECT datname FROM pg_database;", :rows_per_page => 2) do |response|
      response.status.should == 400
      response.body[:errors].should == ["System tables are forbidden"]
    end
  end  
end
