# coding: UTF-8
require_relative '../spec_helper'
require 'models/user_table_shared_examples'

describe UserTable do
  before(:all) do
    bypass_named_maps

    @user = create_user(email: 'admin@cartotest.com', username: 'admin', password: '123456')
    @carto_user = Carto::User.find(@user.id)

    @user_table = ::UserTable.new

    @user_table.user_id = @user.id
    @user_table.name = 'user_table'
    @user_table.save

    # The dependent visualization models are in the Table class for the Sequel model
    @dependent_test_object = @user_table.service
  end

  after(:all) do
    @user_table.destroy
    @user.destroy
  end

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      ::UserTable.new.set_all(attrs)
    end
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
