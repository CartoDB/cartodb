# coding: UTF-8
require_relative '../../spec_helper_min'

describe Carto::UserTable do
  before(:all) do
    bypass_named_maps

    @user = FactoryGirl.create(:carto_user)
    @user_table = Carto::UserTable.create(user: @user, name: 'user_table')
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
  
  describe('#alias') do
    before(:each) do
      @user_table.update_attributes!(alias: nil)
    end

    after(:all) do
      @user_table.update_attributes!(alias: nil)
    end

    it 'sets and gets' do
      @user_table.alias = 'foo'
      @user_table.save
      @user_table.reload.alias.should eq 'foo'
    end
  end

  describe('#schema_alias') do
    let(:schema_alias) do
      {
        one_column: 'with alias',
        another_column: 'with another alias'
      }.with_indifferent_access
    end

    before(:each) do
      @user_table.update_attributes!(schema_alias: {})
    end

    after(:all) do
      @user_table.update_attributes!(schema_alias: {})
    end

    it 'sets and gets' do
      @user_table.update_attributes!(schema_alias: schema_alias)
      @user_table.reload.schema_alias.should eq schema_alias
    end

    it 'ignores format issues' do
      @user_table.update_attributes!(schema_alias: 'not a hash')
      @user_table.reload.schema_alias.should(eq({}))
    end

    it 'ignores nil issues' do
      @user_table.update_attributes!(schema_alias: nil)
      @user_table.reload.schema_alias.should(eq({}))
    end
  end
end
