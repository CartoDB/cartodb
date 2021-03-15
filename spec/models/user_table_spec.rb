require_relative '../spec_helper'
require 'models/user_table_shared_examples'

describe UserTable do
  include_context 'with database purgue'

  let(:user) { create_user(email: 'admin@cartotest.com', username: 'admin', password: '000123456') }
  let(:carto_user) { user.carto_user }
  let(:user_table) do
    table = ::UserTable.new
    table.user_id = user.id
    table.name = 'user_table'
    table.save
    table
  end
  let(:dependent_test_object) { user_table.service }

  before { bypass_named_maps }

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      ::UserTable.new.set_all(attrs)
    end
  end

  it "can save large OIDs" do
    user_table = ::UserTable.new
    user_table.user_id = user.id
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
      user.viewer = true
      user.save

      user_table = ::UserTable.new
      user_table.user_id = user.id
      user_table.name = 'user_table_2'
      expect { user_table.save }.to raise_error(Sequel::ValidationFailed, /Viewer users can't create tables/)
    end

    it "can't delete user tables" do
      bypass_named_maps
      user_table = ::UserTable.new
      user_table.user_id = user.id
      user_table.name = 'user_table_2'
      user_table.save
      user.viewer = true
      user.save
      user_table.reload

      expect { user_table.destroy }.to raise_error(RuntimeError, /Viewer users can't destroy tables/)

      user.viewer = false
      user.save
      user_table.reload
      user_table.destroy
    end
  end
end
