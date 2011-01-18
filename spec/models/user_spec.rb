require 'spec_helper'

describe User do
  it "should have many tables" do
    user = create_user
    user.tables.should be_empty

    create_table :user_id => user.id, :name => 'My first table', :privacy => Table::PUBLIC

    user.tables_count.should == 1
    user.tables.should == [Table.first(:user_id => user.id)]
  end
end
