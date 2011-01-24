# coding: UTF-8

require 'spec_helper'

describe Table do
  it "should have a privacy associated and it should be private by default" do
    table = Table.new
    table.privacy.should be_nil
    table.should be_private
  end

  it "should be associated to a database table" do
    user = create_user
    table = Table.create :name => 'Wadus table', :user_id => user.id
    table.db_table_name.should_not be_blank
    table.db_table_name.should == "wadus_table"
  end

  it "should fetch empty data from the database by SQL sentences" do
    user = create_user
    table = Table.create :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.db_table_name.to_sym).should be_false
    user.in_database do |user_database|
      user_database.table_exists?(table.db_table_name.to_sym).should be_true
    end
    rows = table.execute_sql "select * from #{table.db_table_name} limit 1"
    rows.should be_empty
    table.rows_count.should == 0
  end

  it "has a last_updated attribute that is updated with every operation on the database" do
    user = create_user
    t1 = Time.now - 5.minutes
    Timecop.freeze(t1)
    table = Table.create :name => 'Wadus table', :user_id => user.id
    table.updated_at.should == t1
    t2 = Time.now - 3.minutes
    Timecop.freeze(t2)
    rows = table.execute_sql "select * from #{table.db_table_name} limit 1"
    table.reload
    table.updated_at.should == t2
  end

  it "has a to_json method that allows to fetch rows with pagination" do
    user = create_user
    table = create_table :user_id => user.id

    table.to_json[:total_rows].should == 0
    table.to_json[:columns].should == [[:identifier, :integer], [:name, :string], [:location, :string], [:description, :string]]
    table.to_json[:rows].should be_empty

    10.times do
      table.execute_sql("INSERT INTO #{table.db_table_name} (Name,Location,Description) VALUES ('#{String.random(10)}','#{rand(1000000.0)}','#{String.random(100)}')")
    end

    table.to_json[:total_rows].should == 10
    table.to_json[:rows].size.should == 10

    content = table.execute_sql("select * from #{table.db_table_name}")

    table.to_json(:rows_per_page => 1)[:rows].size.should == 1
    table.to_json(:rows_per_page => 1)[:rows].first.should == content[0]
    table.to_json(:rows_per_page => 1)[:rows].first.should == table.to_json(:rows_per_page => 1, :page => 0)[:rows].first
    table.to_json(:rows_per_page => 1, :page => 1)[:rows].first.should == content[1]
    table.to_json(:rows_per_page => 1, :page => 2)[:rows].first.should == content[2]
  end

  it "has a toggle_privacy! method to toggle the table privacy" do
    user = create_user
    table = create_table :user_id => user.id
    table.should be_private

    table.toggle_privacy!
    table.reload
    table.should_not be_private

    table.toggle_privacy!
    table.reload
    table.should be_private
  end

end
