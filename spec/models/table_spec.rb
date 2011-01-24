# coding: UTF-8

require 'spec_helper'

describe Table do
  it "should have a name and a user_id" do
    table = Table.new
    table.should_not be_valid
    table.errors.on(:name).should_not be_nil
    table.errors.on(:user_id).should_not be_nil
  end

  it "should have a privacy associated and it should be private by default" do
    table = create_table
    table.privacy.should_not be_nil
    table.should_not be_private
  end

  it "should be associated to a database table" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
  end

  it "should fetch empty data from the database by SQL sentences" do
    user = create_user
    table = create_table :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.name.to_sym).should be_true
    end
    rows = table.execute_sql "select * from \"#{table.name}\" limit 1"
    rows.should be_empty
    table.rows_count.should == 0
  end

  it "has a last_updated attribute that is updated with every operation on the database" do
    user = create_user
    t1 = Time.now - 5.minutes
    Timecop.freeze(t1)
    table = create_table :name => 'Wadus table', :user_id => user.id
    table.updated_at.should == t1
    t2 = Time.now - 3.minutes
    Timecop.freeze(t2)
    rows = table.execute_sql "select * from \"#{table.name}\" limit 1"
    table.reload
    table.updated_at.should == t2
  end

  it "has a to_json method that allows to fetch rows with pagination" do
    user = create_user
    table = create_table :user_id => user.id

    table.to_json[:total_rows].should == 0
    table.to_json[:columns].should == [[:id, :integer], [:name, :string], [:location, :string], [:description, :string]]
    table.to_json[:rows].should be_empty

    10.times do
      table.execute_sql("INSERT INTO \"#{table.name}\" (Name,Location,Description) VALUES ('#{String.random(10)}','#{rand(1000000.0)}','#{String.random(100)}')")
    end

    table.to_json[:total_rows].should == 10
    table.to_json[:rows].size.should == 10

    content = table.execute_sql("select * from \"#{table.name}\"")

    table.to_json(:rows_per_page => 1)[:rows].size.should == 1
    table.to_json(:rows_per_page => 1)[:rows].first.should == content[0]
    table.to_json(:rows_per_page => 1)[:rows].first.should == table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    table.to_json(:rows_per_page => 1, :page => 1)[:rows].first.should == content[1]
    table.to_json(:rows_per_page => 1, :page => 2)[:rows].first.should == content[2]
  end

  it "has a toggle_privacy! method to toggle the table privacy" do
    user = create_user
    table = create_table :user_id => user.id, :privacy => Table::PRIVATE
    table.should be_private

    table.toggle_privacy!
    table.reload
    table.should_not be_private

    table.toggle_privacy!
    table.reload
    table.should be_private
  end

end
