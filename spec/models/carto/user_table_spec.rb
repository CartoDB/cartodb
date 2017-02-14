# coding: UTF-8
require_relative '../../spec_helper_min'
require 'models/user_table_shared_examples'

describe Carto::UserTable do
  before(:all) do
    bypass_named_maps

    @user = FactoryGirl.create(:carto_user)
    @carto_user = @user
    @user_table = Carto::UserTable.create(user: @user, name: 'user_table')

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

  describe('#affected_visualizations') do
    before(:each) do
      # We recreate an inconsistent state where a layer has no visualization
      @user_table.stubs(:layers).returns([Carto::Layer.new])
    end

    describe('#fully_dependent_visualizations') do
      it 'resists layers without visualizations' do
        expect { @user_table.fully_dependent_visualizations }.to_not raise_error
      end
    end

    describe('#accessible_dependent_derived_maps') do
      it 'resists layers without visualizations' do
        expect { @user_table.accessible_dependent_derived_maps }.to_not raise_error
      end
    end

    describe('#partially_dependent_visualizations') do
      it 'resists layers without visualizations' do
        expect { @user_table.partially_dependent_visualizations }.to_not raise_error
      end
    end
  end
end
