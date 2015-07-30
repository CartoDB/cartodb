# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/member'

describe Carto::UserTable do

  before(:all) do
    @user = create_user({
        email: 'admin@cartotest.com', 
        username: 'admin', 
        password: '123456'
      })
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
    delete_user_data(@user)
  end

  after(:all) do
    @user.destroy
  end

  describe '#estimated_row_count and #actual_row_count' do

    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:estimated_row_count).returns(999)
      ::Table.any_instance.stubs(:actual_row_count).returns(1000)
      table = create_table({:name => 'table1', :user_id => @user.id})
      user_table = Carto::UserTable.find(table.id)
      user_table.estimated_row_count.should == 999
      user_table.actual_row_count.should == 1000
    end

  end

end
