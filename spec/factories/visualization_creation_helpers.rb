# encoding: utf-8

require_relative '../spec_helper'
require_relative '../support/factories/tables'
require_relative './database_configuration_contexts'
require_relative './organizations_contexts'

include CartoDB

def app
  CartoDB::Application.new
end

def random_username
  "user#{rand(10000)}"
end

def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

def create_random_table(user, name = "viz#{rand(999)}")
  create_table( { user_id: user.id, name: name } )
end

shared_context 'users helper' do
  include_context 'database configuration'

  before(:each) do
    User.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  before(:all) do
    # TODO: Remove this and either all use the global instances or create a true general context with sample users
    @user1 = $user_1
    @user2 = $user_2
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    bypass_named_maps
    delete_user_data @user1 if @user1
    delete_user_data @user2 if @user2
    # User destruction is handled at spec_helper
  end

end

shared_context 'visualization creation helpers' do
  include Warden::Test::Helpers

  before(:each) do
    bypass_named_maps
  end

  private

end
