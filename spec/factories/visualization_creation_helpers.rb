# encoding: utf-8

require_relative '../spec_helper'
require_relative '../support/factories/tables'

include CartoDB

def app
  CartoDB::Application.new
end

def bypass_named_maps
  CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
  CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
end

def random_username
  "user#{rand(10000)}"
end

def login(user)
  login_as(user, scope: user.subdomain)
  host! "#{user.subdomain}.localhost.lan"
end

def create_random_table(user, name = "viz#{rand(999)}")
  create_table( { user_id: user.id, name: name } )
end

shared_context 'database configuration' do

  before(:each) do
    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    database: db_config.fetch('database'),
                    username: db_config.fetch('username')
                  )
    @repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
    CartoDB::Visualization.repository = @repository
  end

end

shared_context 'organization with users helper' do
  include CacheHelper
  include_context 'database configuration'

  bypass_named_maps

  def test_organization
    organization = Organization.new
    organization.name = org_name = "org#{rand(9999)}"
    organization.quota_in_bytes = 1234567890
    organization.seats = 5
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
    @organization = test_organization.save
    @organization_2 = test_organization.save

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

  before(:all) do
    username1 = random_username
    @user1 = create_user(
      username: username1,
      email: "#{username1}@example.com",
      password: 'clientex'
    )

    username2 = random_username
    @user2 = create_user(
      username: username2,
      email: "#{username2}@example.com",
      password: 'clientex2'
    )
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    delete_user_data @user1 if @user1
    delete_user_data @user2 if @user2
    @user1.destroy if @user1
    @user2.destroy if @user2
  end

end

shared_context 'visualization creation helpers' do
  include Warden::Test::Helpers
  bypass_named_maps

  private

end
