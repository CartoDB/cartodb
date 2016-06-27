# coding: UTF-8
require_relative '../spec_helper'

describe UserTable do
  before(:all) do
    bypass_named_maps

    @user = create_user(email: 'admin@cartotest.com', username: 'admin', password: '123456')

    @user_table = ::UserTable.new

    @user_table.user_id = @user.id
    @user_table.name = 'user_table'
    @user_table.save
  end

  after(:all) do
    @user_table.destroy
    @user.destroy
  end

  describe '#estimated_row_count and #actual_row_count' do
    it 'should query Table estimated an actual row count methods' do
      ::Table.any_instance.stubs(:estimated_row_count).returns(999)
      ::Table.any_instance.stubs(:actual_row_count).returns(1000)

      @user_table.estimated_row_count.should == 999
      @user_table.actual_row_count.should == 1000
    end
  end

  it 'should sync table_id with physical table oid' do
    @user_table.table_id = nil
    @user_table.save

    @user_table.table_id.should be_nil

    @user_table.sync_table_id.should eq @user_table.service.get_table_id
  end

  context 'viewer users' do
    after(:each) do
      @user.viewer = false
      @user.save
    end

    it "can't create new user tables" do
      bypass_named_maps
      @user.viewer = true
      @user.save

      @user_table = ::UserTable.new
      @user_table.user_id = @user.id
      @user_table.name = 'user_table_2'
      expect { @user_table.save }.to raise_error(Sequel::ValidationFailed, /Viewer users can't create tables/)
    end

    it "can't delete user tables" do
      bypass_named_maps
      @user_table = ::UserTable.new
      @user_table.user_id = @user.id
      @user_table.name = 'user_table_2'
      @user_table.save
      @user.viewer = true
      @user.save
      @user_table.reload

      expect { @user_table.destroy }.to raise_error(CartoDB::InvalidMember, /Viewer users can't destroy tables/)

      @user.viewer = false
      @user.save
      @user_table.reload
      @user_table.destroy
    end
  end
end
