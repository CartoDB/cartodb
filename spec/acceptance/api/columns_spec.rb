# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 columns management" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user  = create_user({:username => 'test'})
    @table = create_table :user_id => @user.id
  end

  scenario "Get the columns from a table" do    
    get_json api_table_columns_url(@table.name) do |response|
      response.status.should be_success
      (response.body -  default_schema).should be_empty
    end
  end

  scenario "Add a new column to a table" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    post_json api_table_columns_url(@table.name), { :type => "Number", :name => "postal code" } do |response|
      response.status.should be_success
      response.body.should == {
        :name => "postal_code",
        :type => "double precision",
        :cartodb_type => "number"
      }
    end
  end

  scenario "Try to add a new column of an invalid type" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).never
    
    post_json api_table_columns_url(@table.name), { :type => "integerrr", :name => "postal code" } do |response|
      response.status.should == 400
    end
  end

  scenario "Get the type of a column" do
    get_json api_table_column_url(@table.name, "name") do |response|
      response.status.should be_success
      response.body[:type].should == "string"
    end
  end

  scenario "Get the type of a column that doesn't exist" do
    get_json api_table_column_url(@table.name, "namiz") do |response|
      response.status.should == 404
    end
  end

  scenario "Update the type of a given column" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    put_json api_table_column_url(@table.name, "name"), {:type => "number"} do |response|
      response.status.should be_success
      response.body.should == {
        :name => "name",
        :type => "double precision",
        :cartodb_type => "number"
      }
    end
  end

  scenario "Update the type of a given column with an invalid type" do
    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).never
    
    put_json api_table_column_url(@table.name, "name"), {:type => "integerr"} do |response|
      response.status.should == 400
    end
  end

  scenario "Rename a column" do
    delete_user_data @user
    @table = create_table :user_id => @user.id

    CartoDB::QueriesThreshold.expects(:incr).with(@user.id, "other", any_parameters).once
    
    put_json api_table_column_url(@table.name, "name"), {:new_name => "nombresito"} do |response|
      response.status.should be_success
      response.body.should == {
        :name => "nombresito",
        :type => "text",
        :cartodb_type => "string"
      }
    end
  end

  scenario "Drop a column" do
    delete_user_data @user
    @table = create_table :user_id => @user.id    
    
    delete_json api_table_column_url(@table.name, "name") do |response|                
      response.status.should be_success
    end
  end
end