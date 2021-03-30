require_relative '../spec_helper'
require 'models/user_table_shared_examples'

describe UserTable do
  let(:user) { create(:valid_user) }

  before do
    bypass_named_maps

    @user = user
    @carto_user = user.carto_user

    @user_table = ::UserTable.new

    @user_table.user_id = @user.id
    @user_table.name = 'user_table'
    @user_table.save

    # The dependent visualization models are in the Table class for the Sequel model
    @dependent_test_object = @user_table.service
  end

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      ::UserTable.new.set_all(attrs)
    end
  end

  it "can save large OIDs" do
    user_table = ::UserTable.new
    user_table.user_id = @user.id
    user_table.name = 'user_table_3'
    user_table.save
    user_table.reload

    user_table.table_id = 2**32 - 1
    user_table.save
    user_table.reload
    user_table.table_id.should eq 2**32 - 1

    user_table.destroy
  end

  context 'viewer users' do
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

      expect { @user_table.destroy }.to raise_error(RuntimeError, /Viewer users can't destroy tables/)

      @user.viewer = false
      @user.save
      @user_table.reload
      @user_table.destroy
    end
  end
end
