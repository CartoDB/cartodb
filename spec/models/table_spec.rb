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
    table.db_table_name.should == "users_tables_#{user.id}_wadus_table"
  end

  it "should fetch empty data from the database by SQL sentences" do
    user = create_user
    table = Table.create :name => 'Wadus table', :user_id => user.id
    Rails::Sequel.connection.table_exists?(table.db_table_name.to_sym).should be_true
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

end
