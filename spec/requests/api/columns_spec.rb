#encoding: UTF-8

require 'spec_helper'

describe "Columns API" do

  before(:all) do
    @user = create_user(:username => 'test', :email => "client@example.com", :password => "clientex")
    @user.set_map_key
    @table = create_table :user_id => @user.id
  end

  before(:each) do
    delete_user_data @user
    host! 'test.localhost.lan'
  end

  let(:params) { { :api_key => @user.api_key } }

  it "gets the columns from a table" do    
    get_json v1_table_columns_url(@table.name, params) do |response|
      response.status.should be_success
      (response.body - default_schema).should be_empty
    end
  end

  it "adds a new column to a table" do
    post_json v1_table_columns_url(@table.name, params), { :type => "Number", :name => "postal code" } do |response|
      response.status.should be_success
      response.body.should == {
        :name => "postal_code",
        :type => "double precision",
        :cartodb_type => "number"
      }
    end
  end

  it "Try to add a new column of an invalid type" do
    post_json v1_table_columns_url(@table.name, params), { :type => "integerrr", :name => "postal code" } do |response|
      response.status.should == 400
    end
  end

  it "Get the type of a column" do
    get_json v1_table_column_url(@table.name, "name") do |response|
      response.status.should be_success
      response.body[:type].should == "string"
    end
  end

  it "Get the type of a column that doesn't exist" do
    get_json v1_table_column_url(@table.name, "namiz") do |response|
      response.status.should == 404
    end
  end

  it "Update the type of a given column" do
    put_json v1_table_column_url(@table.name, "name"), {:type => "number"} do |response|
      response.status.should be_success
      response.body.should == {
        :name => "name",
        :type => "double precision",
        :cartodb_type => "number"
      }
    end
  end

  it "Update the type of a given column with an invalid type" do
    put_json v1_table_column_url(@table.name, "name"), {:type => "integerr"} do |response|
      response.status.should == 400
    end
  end

  it "Rename a column" do
    delete_user_data @user
    @table = create_table :user_id => @user.id

    put_json v1_table_column_url(@table.name, "name"), {:new_name => "nombresito"} do |response|
      response.status.should be_success
      response.body.should == {
        :name => "nombresito",
        :type => "text",
        :cartodb_type => "string"
      }
    end
  end

  it "Drop a column" do
    delete_user_data @user
    @table = create_table :user_id => @user.id    
    
    delete_json v1_table_column_url(@table.name, "name") do |response|                
      response.status.should eql(204)
    end
  end
end
