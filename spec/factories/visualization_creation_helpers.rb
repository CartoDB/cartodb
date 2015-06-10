# encoding: utf-8

require_relative '../spec_helper'
require_relative '../support/factories/tables'

include CartoDB

def app
  CartoDB::Application.new
end

def bypass_named_maps
  CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true, :delete => true)
end

def random_username
  "user#{rand(10000)}"
end

def login(user)
  login_as(user, scope: user.subdomain)
  host! "#{user.subdomain}.localhost.lan"
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

  before(:all) do
    username1 = random_username
    @org_user_1 = create_user(
      username: username1,
      email: "#{username1}@example.com",
      password: 'clientex',
      private_tables_enabled: true
    )

    username2 = random_username
    @org_user_2 = create_user(
      username: username2,
      email: "#{username2}@example.com",
      password: 'clientex2',
      private_tables_enabled: true
    )

    @organization = test_organization.save

    user_org = CartoDB::UserOrganization.new(@organization.id, @org_user_1.id)
    user_org.promote_user_to_admin
    @organization.reload
    @org_user_1.reload

    @org_user_2.organization_id = @organization.id
    @org_user_2.save.reload
    @organization.reload
  end

  before(:each) do
    bypass_named_maps
    delete_user_data @org_user_1
    delete_user_data @org_user_2
  end

  after(:all) do
    delete_user_data @org_user_1 if @org_user_1
    delete_user_data @org_user_2 if @org_user_2
    @org_user_2.destroy if @org_user_2
    @org_user_1.destroy if @org_user_1
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

  def create_random_table(user, name = "viz#{rand(999)}")
    create_table( { user_id: user.id, name: name } )
  end

  private

end
