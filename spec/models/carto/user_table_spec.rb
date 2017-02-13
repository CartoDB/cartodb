# coding: UTF-8
require_relative '../../spec_helper_min'
require 'models/user_table_shared_examples'

describe Carto::UserTable do
  include UniqueNamesHelper

  before(:all) do
    bypass_named_maps

    @user = FactoryGirl.create(:carto_user)
    @carto_user = @user
    @user_table = Carto::UserTable.new(user: @user, name: unique_name('user_table'))

    # The dependent visualization models are in the UserTable class for the AR model
    @dependent_test_object = @user_table
  end

  after(:all) do
    @user_table.destroy
    @user.destroy
  end

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      Carto::UserTable.new(attrs)
    end
  end

  it 'sets privacy to nil by default' do
    expect(Carto::UserTable.new.privacy).to be_nil
  end

  describe '#readable_by?' do
    include_context 'organization with users helper'
    include TableSharing

    it 'returns true for shared tables' do
      @table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: "a_table_name", user_id: @org_user_1.id)
      user_table = Carto::UserTable.find(@table.id)
      share_table_with_user(@table, @org_user_2)

      user_table.readable_by?(@carto_org_user_2).should be_true
    end
  end
end
