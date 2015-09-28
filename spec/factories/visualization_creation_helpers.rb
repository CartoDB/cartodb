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

# requires include Warden::Test::Helpers
def login(user)
  login_as(user, scope: user.username)
  host! "#{user.username}.localhost.lan"
end

def create_random_table(user, name = "viz#{rand(999)}")
  create_table( { user_id: user.id, name: name } )
end

def create_table_with_options(user, headers = { 'CONTENT_TYPE'  => 'application/json' }, options = {})
  privacy = options.fetch(:privacy, 1)

  seed    = rand(9999)
  payload = {
    name:         "table #{seed}",
    description:  "table #{seed} description"
  }

  table_attributes = nil
  post_json api_v1_tables_create_url(user_domain: user.username, api_key: user.api_key), payload.to_json, headers do |r|
    table_attributes  = r.body.stringify_keys
    table_id          = table_attributes.fetch('id')

    put api_v1_tables_update_url(id: table_id, user_domain: user.username, api_key: user.api_key),
        { privacy: privacy }.to_json, headers
  end

  table_attributes
end

shared_context 'organization with users helper' do
  include CacheHelper
  include_context 'database configuration'

  def test_organization
    organization = Organization.new
    organization.name = org_name = "org#{rand(9999)}"
    organization.quota_in_bytes = 1234567890
    organization.seats = 50
    organization
  end

  def create_test_user(username, organization = nil)
    user = create_user(
      username: username,
      email: "#{username}@example.com",
      password: username,
      private_tables_enabled: true,
      organization: organization
    )
    user.save.reload
    organization.reload if organization
    user
  end

  before(:all) do
    @organization = test_organization.save.reload
    @organization_2 = test_organization.save.reload

    @org_user_owner = create_test_user("o#{random_username}")
    user_org = CartoDB::UserOrganization.new(@organization.id, @org_user_owner.id)
    user_org.promote_user_to_admin
    @organization.reload
    @org_user_owner.reload

    @org_user_1 = create_test_user("a#{random_username}", @organization)
    @org_user_2 = create_test_user("b#{random_username}", @organization)

    @organization.reload
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @org_user_owner
    delete_user_data @org_user_1
    delete_user_data @org_user_2
  end

  after(:all) do
    bypass_named_maps
    delete_user_data @org_user_owner if @org_user_owner
    @organization.destroy_cascade
  end

  def share_table(table, owner, user)
    bypass_named_maps
    headers = {'CONTENT_TYPE'  => 'application/json'}
    perm_id = table.table_visualization.permission.id

    put api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id),
        {acl: [{
                 type: CartoDB::Permission::TYPE_USER,
                 entity: {
                   id:   user.id,
                 },
                 access: CartoDB::Permission::ACCESS_READONLY
               }]}.to_json, headers
    response.status.should == 200
  end

  def share_table_with_organization(table, owner, organization)
    bypass_named_maps
    headers = {'CONTENT_TYPE'  => 'application/json'}
    perm_id = table.table_visualization.permission.id

    put api_v1_permissions_update_url(user_domain: owner.username, api_key: owner.api_key, id: perm_id),
        {acl: [{
                 type: CartoDB::Permission::TYPE_ORGANIZATION,
                 entity: {
                   id:   organization.id,
                 },
                 access: CartoDB::Permission::ACCESS_READONLY
               }]}.to_json, headers
    last_response.status.should == 200
  end

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
