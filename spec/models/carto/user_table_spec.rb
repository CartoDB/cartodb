# coding: UTF-8
require_relative '../../spec_helper_min'
require 'models/user_table_shared_examples'

describe Carto::UserTable do
  include UniqueNamesHelper

  before(:all) do
    bypass_named_maps

    @user = FactoryGirl.create(:carto_user)
    @carto_user = @user

    @user_table = Carto::UserTable.new
    @user_table.user = @user
    @user_table.name = unique_name('user_table')
    @user_table.save

    # The dependent visualization models are in the UserTable class for the AR model
    @dependent_test_object = @user_table
  end

  after(:all) do
    @user_table.destroy
    @user.destroy
  end

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      ut = Carto::UserTable.new
      ut.assign_attributes(attrs, without_protection: true)
      ut
    end
  end

  describe '#default_privacy' do
    it 'sets privacy to nil by default' do
      expect(Carto::UserTable.new.privacy).to be_nil
    end

    it 'lets caller specify privacy' do
      [UserTable::PRIVACY_PRIVATE, UserTable::PRIVACY_LINK, UserTable::PRIVACY_PUBLIC].each do |privacy|
        expect(Carto::UserTable.new(privacy: privacy).privacy).to eq privacy
      end
    end
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
