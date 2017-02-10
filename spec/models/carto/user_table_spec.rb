# coding: UTF-8
require_relative '../../spec_helper_min'
require 'models/user_table_shared_examples'

describe Carto::UserTable do
  before(:all) do
    bypass_named_maps

    @user = FactoryGirl.create(:carto_user)
    @carto_user = @user
    @user_table = FactoryGirl.create(:public_user_table, user: @user)

    # The dependent visualization models are in the UserTable class for the AR model
    @dependent_test_object = @user_table
  end

  after(:all) do
    @user_table.destroy
    @user.destroy
  end

  it_behaves_like 'user table models'

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
