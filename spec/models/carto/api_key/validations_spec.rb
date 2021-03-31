require 'spec_helper_unit'
require 'helpers/database_connection_helper'

describe Carto::ApiKey do
  include CartoDB::Factories
  include DatabaseConnectionHelper
  include ApiKeySpecHelpers

  before do
    @table1 = create_table(user_id: carto_user.id)
    @table2 = create_table(user_id: carto_user.id)
  end

  shared_examples_for 'API key validations' do
    it 'fails with invalid schema permissions' do
      database_grants = {
        type: "database",
        tables: [
          {
            schema: "wadus",
            name: "wadus",
            permissions: ["insert"]
          }
        ],
        schemas: [
          {
            name: "wadus",
            permissions: ["create", "insert"]
          }
        ]
      }
      grants = [apis_grant, database_grants]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: grants)
      }.to raise_exception(ActiveRecord::RecordInvalid, /value "insert" did not match one of the following values/)
    end

    it 'validates with no tables' do
      database_grants = {
        type: "database"
      }
      grants = [apis_grant, database_grants]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: grants)
      }.to_not raise_error
    end

    it 'validates tables_metadata grant' do
      database_grants = {
        type: "database",
        table_metadata: []
      }
      grants = [apis_grant, database_grants]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: grants)
      }.to_not raise_error
    end

    it 'validates do API grant' do
      apis_grants = {
        type: "apis",
        apis: ["do"]
      }
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: [apis_grants])
      }.to_not raise_error
    end

    it 'fails with several apis sections' do
      two_apis_grant = [apis_grant, apis_grant, database_grant]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
      }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one apis section is allowed/)
    end

    it 'fails with several database sections' do
      two_apis_grant = [apis_grant, database_grant, database_grant]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
      }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one database section is allowed/)
    end

    it 'fails when creating without apis grants' do
      grants = JSON.parse('
    [
      {
        "type": "database",
        "tables": [{
          "name": "something",
          "schema": "public",
          "permissions": [
            "select"
          ]
        },
        {
          "name": "another",
          "schema": "public",
          "permissions": ["insert", "update", "select"]
        }
        ]
      }
    ]', symbolize_names: true)
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: grants)
      }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one apis section is allowed/)
    end

    it 'fails with several dataservices sections' do
      two_apis_grant = [apis_grant, data_services_grant, data_services_grant]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
      }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one dataservices section is allowed/)
    end

    it 'fails with several user sections' do
      two_apis_grant = [apis_grant, user_grant, user_grant]
      expect {
        carto_user.api_keys.create_regular_key!(name: 'x', grants: two_apis_grant)
      }.to raise_exception(ActiveRecord::RecordInvalid, /Grants only one user section is allowed/)
    end

    context 'without enough regular api key quota' do
      before do
        carto_user.regular_api_key_quota = 0
        carto_user.save
      end

      it 'raises an exception when creating a regular key' do
        grants = [database_grant(@table1.database_schema, @table1.name), apis_grant]

        expect {
          carto_user.api_keys.create_regular_key!(name: 'full', grants: grants)
        }.to raise_exception(CartoDB::QuotaExceeded, /limit of API keys/)
      end
    end
  end

  context 'with regular users' do
    let(:carto_user) { create(:valid_user).carto_user }
    let(:sequel_user) { carto_user.sequel_user }

    it_behaves_like 'API key validations'
  end

  context 'with organization users' do
    let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
    let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
    let(:carto_user) { organization.owner }
    let(:sequel_user) { carto_user.sequel_user }

    it_behaves_like 'API key validations'
  end
end
