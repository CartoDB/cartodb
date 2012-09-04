require 'spec_helper'

describe Map do

  before(:all) do
    @quota_in_bytes = 524288000
    @table_quota    = 500
    @user     = create_user(:quota_in_bytes => @quota_in_bytes, :table_quota => @table_quota)
  end

  context "layer setups" do
    
    it "should allow to be linked to a table" do
      table = Table.new
      table.user_id = @user.id
      table.save
      map = Map.create(:user_id => @user.id, :table_id => table.id)
      map.reload
      table.reload

      table.map.should == map
      map.table.should == table
    end
  
  end
end
