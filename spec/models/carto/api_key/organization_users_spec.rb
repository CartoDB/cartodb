require 'spec_helper_unit'
require 'helpers/database_connection_helper'
require 'support/api_key_shared_examples'

describe Carto::ApiKey do
  include CartoDB::Factories
  include DatabaseConnectionHelper
  include ApiKeySpecHelpers

  let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
  let(:carto_user) { organization.owner }
  let(:sequel_user) { carto_user.sequel_user }
  let(:other_user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:organization_user) do
    create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true })
  end

  it_behaves_like 'API key model'

  it 'fails to grant to a non-owned table' do
    table = create_table(user_id: other_user.id)
    grants = [table_grant(table.database_schema, table.name), apis_grant]
    expect {
      carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    }.to raise_exception ActiveRecord::RecordInvalid

    table.destroy
    other_user.destroy
  end

  it 'fails to grant to a non-owned schema' do
    table = create_table(user_id: other_user.id)
    grants = [schema_grant(table.database_schema), apis_grant]
    expect do
      organization_user.api_keys.create_regular_key!(name: 'full', grants: grants)
    end.to raise_exception ActiveRecord::RecordInvalid
  end

  it 'drop role with grants of objects owned by other user' do
    table = create_table(user_id: organization.owner.id)
    table_grants = [table_grant(table.database_schema, table.name), apis_grant]
    api_key = organization.owner.api_keys.create_regular_key!(name: 'full', grants: table_grants)

    organization.owner.sequel_user.in_database.run(
      "GRANT SELECT ON \"#{table.database_schema}\".#{table.name} TO \"#{api_key.db_role}\""
    )

    expect { api_key.destroy! }.not_to raise_error
  end

  it 'reassigns role ownerships after deleting an OAuth API key' do
    create_schema(carto_user)
    carto_user.in_database(as: :superuser).execute('DROP ROLE IF EXISTS "test"')
    carto_user.in_database(as: :superuser).execute('CREATE ROLE "test"')
    grant_user(carto_user)
    api_key = create_oauth_api_key(carto_user)

    with_connection_from_api_key(api_key) do |connection|
      connection.execute("create table test.wadus()")
    end

    api_key.destroy

    ownership_query = "select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'wadus'"
    carto_user.in_database.execute(ownership_query) do |result|
      result[0]['owner'].should eq carto_user.database_username
    end

    carto_user.in_database(as: :superuser).execute("drop table test.wadus")
  end
end
