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

  it "can be associated to many tags" do
    user = create_user
    table = create_table :user_id => user.id
    table.tags = "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 3
    tag1 = Tag[:name => 'tag 1']
    tag1.count.should == 1
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id
    tag2 = Tag[:name => 'tag 2']
    tag2.user_id.should == user.id
    tag2.table_id.should == table.id
    tag2.count.should == 1
    tag3 = Tag[:name => 'tag 3']
    tag3.user_id.should == user.id
    tag3.count.should == 1
    tag3.table_id.should == table.id

    table.tags = "tag 1"
    Tag.count.should == 1
    tag1 = Tag[:name => 'tag 1']
    tag1.count.should == 1
    tag1.table_id.should == table.id
    tag1.user_id.should == user.id

    table.tags = "    "
    Tag.count.should == 0
  end

  it "should increase its counter when associated to different tables" do
    user = create_user
    table1 = create_table :user_id => user.id
    table1.tags = "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 3
    tag1 = Tag[:name => 'tag 1']
    tag1.count.should == 1

    table2 = create_table :user_id => user.id
    table2.tags = "tag 1"
    Tag.count.should == 4
    tag11 = Tag[:name => 'tag 1', :table_id => table1.id]
    tag11.count.should == 2
    tag12 = Tag[:name => 'tag 1', :table_id => table2.id]
    tag12.count.should == 2
  end

  it "should not modify other user tags" do
    user1 = create_user
    table1 = create_table :user_id => user1.id
    user2 = create_user
    table2 = create_table :user_id => user2.id
    table1.tags = "tag 1, tag 2,tag 3, tag 3"
    table2.tags = "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 6
    tag1 = Tag[:name => 'tag 1', :user_id => user1.id]
    tag1.count.should == 1

    table3 = create_table :user_id => user1.id
    table3.tags = "tag 1"
    Tag.count.should == 7
    Tag[:name => 'tag 1', :table_id => table1.id, :user_id => user1.id].count.should == 2
    Tag[:name => 'tag 1', :table_id => table3.id, :user_id => user1.id].count.should == 2
    Tag[:name => 'tag 1', :table_id => table2.id, :user_id => user2.id].count.should == 1
  end

  it "should update counters when removing the tags with the same name but in different tables" do
    user1 = create_user
    table1 = create_table :user_id => user1.id
    user2 = create_user
    table2 = create_table :user_id => user2.id
    table1.tags = "tag 1, tag 2,tag 3, tag 3"
    table2.tags = "tag 1, tag 2,tag 3, tag 3"
    Tag.count.should == 6
    table3 = create_table :user_id => user1.id
    table3.tags = "tag 1, tag 2, tag 3"
    Tag.count.should == 9
    Tag[:name => 'tag 1', :table_id => table1.id, :user_id => user1.id].count.should == 2
    Tag[:name => 'tag 1', :table_id => table3.id, :user_id => user1.id].count.should == 2
    Tag[:name => 'tag 1', :table_id => table2.id, :user_id => user2.id].count.should == 1

    table1.tags = "tag 2, tag 3"
    Tag.count.should == 8
    Tag[:name => 'tag 1', :table_id => table1.id, :user_id => user1.id].should be_nil
    Tag[:name => 'tag 1', :table_id => table3.id, :user_id => user1.id].count.should == 1
    Tag[:name => 'tag 2', :table_id => table1.id, :user_id => user1.id].count.should == 2
    Tag[:name => 'tag 3', :table_id => table1.id, :user_id => user1.id].count.should == 2

    table1.tags = ""
    Tag.count.should == 6
    Tag[:name => 'tag 1', :table_id => table1.id, :user_id => user1.id].should be_nil
    Tag[:name => 'tag 1', :table_id => table3.id, :user_id => user1.id].count.should == 1
    Tag[:name => 'tag 1', :table_id => table2.id, :user_id => user2.id].count.should == 1
  end

end
