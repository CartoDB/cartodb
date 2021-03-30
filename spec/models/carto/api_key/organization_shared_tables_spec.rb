require 'spec_helper_unit'
require 'helpers/database_connection_helper'

describe Carto::ApiKey do
  include CartoDB::Factories
  include DatabaseConnectionHelper
  include ApiKeySpecHelpers

  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:organization_user) do
    create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true })
  end

  before do
    @shared_table = create_table(user_id: organization.owner.id)
    perm = @shared_table.table_visualization.permission
    perm.acl = [{ type: 'user', entity: { id: organization_user.id }, access: 'rw' }]
    perm.save!
  end

  it 'should create an api key using a shared table' do
    grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
    api_key = organization_user.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

    schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("select count(1) from #{schema_table}") do |result|
        result[0]['count'].should eq '0'
      end
    end
    api_key.destroy
  end

  it 'should revoke permissions removing shared permissions (rw to r)' do
    grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
    api_key = organization_user.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

    # remove shared permissions
    @shared_table.table_visualization.reload
    perm = @shared_table.table_visualization.permission
    perm.acl = [{ type: 'user', entity: { id: organization_user.id }, access: 'r' }]
    perm.save!

    schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("select count(1) from #{schema_table}") do |result|
        result[0]['count'].should eq '0'
      end

      expect {
        connection.execute("insert into #{schema_table} (name) values ('wadus')")
      }.to raise_exception /permission denied/
    end

    api_key.destroy
  end

  it 'should revoke permissions removing shared permissions (rw to none)' do
    grants = [apis_grant(['sql']), table_grant(@shared_table.database_schema, @shared_table.name)]
    api_key = organization_user.api_keys.create_regular_key!(name: 'grants_shared', grants: grants)

    # remove shared permissions
    @shared_table.table_visualization.reload
    perm = @shared_table.table_visualization.permission
    perm.acl = []
    perm.save!

    schema_table = "\"#{@shared_table.database_schema}\".\"#{@shared_table.name}\""

    with_connection_from_api_key(api_key) do |connection|
      expect {
        connection.execute("select count(1) from #{schema_table}")
      }.to raise_exception /permission denied/

      expect {
        connection.execute("insert into #{schema_table} (name) values ('wadus')")
      }.to raise_exception /permission denied/
    end

    api_key.destroy
  end
end
