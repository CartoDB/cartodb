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

  describe('#name_alias') do
    let(:name_alias) { 'Manolo Escobar' }

    after(:all) do
      @user_table.update_attributes!(name_alias: nil)
    end

    it 'sets and gets' do
      @user_table.update_attributes!(name_alias: name_alias)
      @user_table.reload.name_alias.should eq(name_alias)
    end
  end

  describe('#column_aliases') do
    let(:column_aliases) do
      {
        one_column: 'with an alias',
        another_column: 'with another alias'
      }.with_indifferent_access
    end

    before(:each) do
      @user_table.update_attributes!(column_aliases: {})
    end

    after(:all) do
      @user_table.update_attributes!(column_aliases: {})
    end

    it 'sets and gets' do
      @user_table.update_attributes!(column_aliases: column_aliases)
      @user_table.reload.column_aliases.should eq column_aliases
    end

    it 'ignores format issues' do
      @user_table.update_attributes!(column_aliases: 'not a hash')
      @user_table.reload.column_aliases.should(eq({}))
    end

    it 'ignores nil issues' do
      @user_table.update_attributes!(column_aliases: nil)
      @user_table.reload.column_aliases.should(eq({}))
    end
  end
end
