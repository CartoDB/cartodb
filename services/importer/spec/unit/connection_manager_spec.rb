require_relative '../../../../spec/spec_helper'
require_relative '../doubles/connector'

describe Carto::ConnectionManager do

  let(:user) { create(:carto_user_light) }
  let(:connection_manager) { Carto::ConnectionManager.new(user) }
  let(:other_user) { create(:carto_user_light) }
  let(:other_connection_manager) { Carto::ConnectionManager.new(other_user) }

  let(:organization) { create(:organization_with_light_users) }
  let(:org_owner) { organization.owner }
  let(:org_member) { organization.users.all.find{|u| u != org_owner } }
  let(:org_owner_connection_manager) { Carto::ConnectionManager.new(org_owner) }
  let(:org_member_connection_manager) { Carto::ConnectionManager.new(org_member) }

  around do |example|
    config = { 'dummy' => { 'enabled' => true } }

    Cartodb.with_config(connectors: config) do
      # TODO: use mock connectors for snowflake, redshift, postgres, bigquery
      with_connector_providers(DummyConnectorProvider, incremental: true, &example)
    end
  end

  let(:connection1) do
    create(:connection, user: user, name: 'db1', connector: 'dummy', parameters: { server: 'server1' })
  end

  let(:connection2) do
    create(:connection, user: user, name: 'oauth1', connector: 'gdrive', token: 'token1')
  end

  let(:connection3) do
    create(:connection, user: user, name: 'oauth2', connector: 'box', token: 'token2')
  end

  let(:other_connection1) do
    create(:connection, user: other_user, name: 'db1', connector: 'dummy', parameters: { server: 'server1' })
  end

  let(:other_connection2) do
    create(:connection, user: other_user, name: 'oauth1', connector: 'gdrive', token: 'token1')
  end

  let(:other_connection3) do
    create(:connection, user: other_user, name: 'oauth2', connector: 'box', token: 'token2')
  end

  let(:shared_connection1) do
    create(:connection, organization: organization, name: 'db1', connector: 'dummy', parameters: { server: 'server1' })
  end

  describe "#list_connections" do
    it "presents all individual user connections" do
      expected_connections = [
        { id: connection1.id, name: connection1.name, connector: connection1.connector,
          type: connection1.connection_type, parameters: connection1.parameters, shared: false, editable: true },
        { id: connection2.id, name: connection2.name, connector: connection2.connector,
          type: connection2.connection_type, token: '********', shared: false, editable: true },
        { id: connection3.id, name: connection3.name, connector: connection3.connector,
          type: connection3.connection_type, token: '********', shared: false, editable: true }
      ]
      connections = connection_manager.list_connections.sort_by { |c| c['name'] }
      expect(connections).to eq(expected_connections)
    end

    it "presents also shared connections" do
      expected_connections = [
        { id: shared_connection1.id, name: shared_connection1.name, connector: shared_connection1.connector,
          type: shared_connection1.connection_type, parameters: shared_connection1.parameters, shared: true, editable: false }
      ]
      connections = org_member_connection_manager.list_connections.sort_by { |c| c['name'] }
      expect(connections).to eq(expected_connections)
    end

    it "presents owner shared connections as editable" do
      expected_connections = [
        { id: shared_connection1.id, name: shared_connection1.name, connector: shared_connection1.connector,
          type: shared_connection1.connection_type, parameters: shared_connection1.parameters, shared: true, editable: true }
      ]
      connections = org_owner_connection_manager.list_connections.sort_by { |c| c['name'] }
      expect(connections).to eq(expected_connections)
    end
  end

  describe "#show_connection" do
    it "presents a single connection" do
      expected_connection = {
        id: connection1.id, name: connection1.name, connector: connection1.connector,
        type: connection1.connection_type, parameters: connection1.parameters,
        shared: false, editable: true
      }
      connection = connection_manager.show_connection(connection1.id)
      expect(connection).to eq(expected_connection)
    end
  end

  describe "#find_db_connection" do
    it "finds existing connections" do
      connection = connection_manager.find_db_connection(
        connection1.connector,
        connection1.parameters
      )
      expect(connection).to eq(connection1)
    end
  end

  describe "#create_db_connection" do
    it "creates new individual connections" do
      connection = connection_manager.create_db_connection(
        name: 'new_connection',
        provider: connection1.connector,
        parameters: connection1.parameters
      )
      expect(connection.id).not_to eq(connection1.id)
      expect(connection.shared?).to eq(false)
      expect(connection.user_id).to eq(user.id)
    end
    it "creates new shared connections" do
      connection = org_owner_connection_manager.create_db_connection(
        name: 'new_connection',
        provider: connection1.connector,
        parameters: connection1.parameters,
        shared: true
      )
      expect(connection.id).not_to eq(connection1.id)
      expect(connection.shared?).to eq(true)
      expect(connection.user_id).to be(nil)
      expect(connection.organization_id).to eq(organization.id)
    end
    it "does not create shared connections for non-org users" do
      expect do
        connection_manager.create_db_connection(
          name: 'new_connection',
          provider: connection1.connector,
          parameters: connection1.parameters,
          shared: true
        )
      end.to raise_exception(RuntimeError)
    end
    it "does not create shared connections for non-owners" do
      expect do
        connection = org_member_connection_manager.create_db_connection(
          name: 'new_connection',
          provider: connection1.connector,
          parameters: connection1.parameters,
          shared: true
        )
      end.to raise_exception(RuntimeError)
    end
  end

  describe "#find_or_create_db_connection" do
    it "finds existing connections" do
      connection = connection_manager.find_or_create_db_connection(
        connection1.connector,
        connection1.parameters
      )
      expect(connection).to eq(connection1)
    end

    it "creates new connections" do
      connection = connection_manager.find_or_create_db_connection(
        'dummy',
        { server: 'another_server' }
      )
      expect(connection.id).not_to eq(connection1.id)
    end
  end

  describe "#find_oauth_connection" do
    it "finds existing connections" do
      connection = connection_manager.find_oauth_connection(connection2.connector)
      expect(connection).to eq(connection2)
    end
  end

  describe "#create_oauth_connection_get_url" do
    it "returns the oauth url for a service" do
      CartoDB::Datasources::Url::Dropbox.any_instance.stubs(:get_auth_url).returns('the-oauth-url')
      url = connection_manager.create_oauth_connection_get_url(service: 'dropbox')
      expect(url).to eq('the-oauth-url')
      CartoDB::Datasources::Url::Dropbox.any_instance.unstub(:get_auth_url)
    end

    it "removes existing connection for the service" do
      create(:connection, user: user, name: 'x', connector: 'dropbox', token: 'token')
      expect(user.oauth_connections.find_by(connector: 'dropbox')).not_to be(nil)

      CartoDB::Datasources::Url::Dropbox.any_instance.stubs(:get_auth_url).returns('the-oauth-url')
      url = connection_manager.create_oauth_connection_get_url(service: 'dropbox')
      expect(user.oauth_connections.find_by(connector: 'dropbox')).to be(nil)
      CartoDB::Datasources::Url::Dropbox.any_instance.unstub(:get_auth_url)
    end
  end

  describe "#create_oauth_connection" do
    it "creates new connections" do
      connection = connection_manager.create_oauth_connection(
        service: 'dropbox',
        token: 'the-token'
      )
      expect(connection.id).not_to eq(connection1.id)
      expect(user.oauth_connections.find_by(connector: 'dropbox')).to eq(connection)
    end

    it "builds new connection if user not saved" do
      unsaved_user = build(:carto_user_light)
      connection_manager = Carto::ConnectionManager.new(unsaved_user)
      connection = connection_manager.create_oauth_connection(
        service: 'dropbox',
        token: 'the-token'
      )
      expect(connection.id).to be(nil)
      expect(unsaved_user.individual_connections.to_a.find{|c| c.connector == 'dropbox'}).to eq(connection)
      unsaved_user.save!
      expect(unsaved_user.oauth_connections.find_by(connector: 'dropbox')).to eq(connection)
    end
  end

  describe "#assign_db_parameters" do
    it "adds parameters to created oauth connection" do
      expect(connection2.parameters).to be(nil)
      Carto::ConnectionManager.any_instance.stubs(:oauth_connection_valid?).returns(true)
      connection = connection_manager.assign_db_parameters(
        service: connection2.service, parameters: { 'billing_project' => 'the-billing-project'}
      )
      Carto::ConnectionManager.any_instance.unstub(:oauth_connection_valid?)
      expect(connection.connector).to eq(connection2.connector)
      expect(connection.id).to eq(connection2.id)
      expect(connection.parameters).to eq({ 'billing_project' => 'the-billing-project'})
    end
  end

  describe "#fetch_connection" do
    it "fetches connections" do
      expect(connection_manager.fetch_connection(connection1.id)).to eq(connection1)
    end

    it "does not fetch other user connections" do
      connection = other_connection_manager.fetch_connection(connection1.id)
      expect(connection).to be(nil)
    end
  end

  describe "#delete_connection" do
    it "deletes connections" do
      expect(Carto::Connection.find_by(id: connection1.id)).not_to be(nil)
      connection_manager.delete_connection(connection1.id)
      expect(Carto::Connection.find_by(id: connection1.id)).to be(nil)
    end

    it "does not delete other user connections" do
      expect(Carto::Connection.find_by(id: connection1.id)).not_to be(nil)
      expect do
        other_connection_manager.delete_connection(connection1.id)
      end.to raise_exception(Carto::ConnectionManager::ConnectionNotFoundError)
      expect(Carto::Connection.find_by(id: connection1.id)).not_to be(nil)
    end

    it "does not delete shared connection if user is not owner" do
      expect(Carto::Connection.find_by(id: shared_connection1.id)).not_to be(nil)
      expect do
        org_member_connection_manager.delete_connection(shared_connection1.id)
      end.to raise_exception(Carto::ConnectionManager::ConnectionUnauthorizedError)
      expect(Carto::Connection.find_by(id: shared_connection1.id)).not_to be(nil)
    end

    it "deletes shared connection if user is owner" do
      expect(Carto::Connection.find_by(id: shared_connection1.id)).not_to be(nil)
      org_owner_connection_manager.delete_connection(shared_connection1.id)
      expect(Carto::Connection.find_by(id: shared_connection1.id)).to be(nil)
    end
  end

  describe "#update_db_connection" do
    it "updates connection name" do
      old_name = connection1.name
      old_parameters = connection1.parameters
      new_name = 'db_1'
      expect(old_name).to eq('db1')
      connection_manager.update_db_connection(id: connection1.id, name: new_name)
      connection = Carto::Connection.find_by(id: connection1.id)
      expect(connection.name).to eq(new_name)
      expect(connection.parameters).to eq(old_parameters)
    end

    it "updates connection parameters" do
      old_name = connection1.name
      old_parameters = connection1.parameters
      new_parameters = old_parameters.merge('another_param' => 'xyz')
      connection_manager.update_db_connection(id: connection1.id, parameters: new_parameters)
      connection = Carto::Connection.find_by(id: connection1.id)
      expect(connection.name).to eq(old_name)
      expect(connection.parameters).to eq(new_parameters)
    end

    it "does not update shared connections if not the owner" do
      old_name = shared_connection1.name
      old_parameters = shared_connection1.parameters
      new_parameters = old_parameters.merge('another_param' => 'xyz')
      expect do
        org_member_connection_manager.update_db_connection(id: shared_connection1.id, parameters: new_parameters)
      end.to raise_exception(Carto::ConnectionManager::ConnectionUnauthorizedError)
      connection = Carto::Connection.find_by(id: shared_connection1.id)
      expect(connection.name).to eq(old_name)
      expect(connection.parameters).to eq(old_parameters)
    end

    it "updates shared connections if the owner" do
      old_name = shared_connection1.name
      old_parameters = shared_connection1.parameters
      new_parameters = old_parameters.merge('another_param' => 'xyz')
      org_owner_connection_manager.update_db_connection(id: shared_connection1.id, parameters: new_parameters)
      connection = Carto::Connection.find_by(id: shared_connection1.id)
      expect(connection.name).to eq(old_name)
      expect(connection.parameters).to eq(new_parameters)
    end
  end

  describe '#adapt_db_connector_parameters' do
    let(:params) { { extra_parameter: 1 } }
    let(:params_with_connection_id) { params.merge(connection_id: connection1.id) }
    let(:params_with_connection) { params.merge(provider:connection1.provider, connection: connection1.parameters) }
    let(:params_with_different_connection) do
      different_connection = connection1.parameters.merge('server' => 'different_server')
      params.merge(provider:connection1.provider, connection: different_connection)
    end

    it "adapts parameters from a connection" do
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(
        parameters: params, connection: connection1
      )
      expect(in_params.parameters).to eq(params_with_connection_id)
      expect(conn_params.parameters).to eq(params_with_connection)
    end

    it "adapts parameters from a connection_id" do
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(parameters: params_with_connection_id)
      expect(in_params.parameters).to eq(params_with_connection_id)
      expect(conn_params.parameters).to eq(params_with_connection)
    end

    it "adapts parameters from legacy connection subparameter" do
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(parameters: params_with_connection)
      expect(in_params.parameters).to eq(params_with_connection)
      expect(conn_params.parameters).to eq(params_with_connection)
    end

    it "can register a new connection" do
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(
        parameters: params_with_different_connection, register: true
      )
      expect(in_params.parameters[:connection_id]).not_to eq(connection1.id)
      expect(conn_params.parameters).to eq(params_with_different_connection)
      connection = Carto::Connection.find_by(id: in_params.parameters[:connection_id])
      expect(connection.parameters).to eq(params_with_different_connection[:connection])
      expect(connection.connector).to eq(params_with_different_connection[:provider])
    end

    it "will reuse an existing connection if possible" do
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(
        parameters: params_with_connection, register: true
      )
      expect(in_params.parameters).to eq(params_with_connection_id)
      expect(conn_params.parameters).to eq(params_with_connection)
    end

    it "adds parameters for legacy BQ connections" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('bigquery')

      user.oauths.add('bigquery', 'the-token')

      legacy_bq_params = {
        provider: 'bigquery',
        connection: {
          billing_project: 'the-billing-project'
        }
      }
      params_with_token = legacy_bq_params.merge(
        connection: legacy_bq_params[:connection].merge(refresh_token: 'the-token')
      )
      in_params, conn_params = connection_manager.adapt_db_connector_parameters(parameters: legacy_bq_params.dup)
      expect(in_params.parameters).to eq(legacy_bq_params)
      expect(conn_params.parameters).to eq(params_with_token)
    end
  end

  describe '.singleton_connector?' do
    it "regards oauth connect as singleton" do
      expect(Carto::ConnectionManager.singleton_connector?(connection2)).to eq(true)
      expect(Carto::ConnectionManager.singleton_connector?(connection3)).to eq(true)
      expect(Carto::ConnectionManager.singleton_connector?(other_connection2)).to eq(true)
      expect(Carto::ConnectionManager.singleton_connector?(other_connection3)).to eq(true)
    end

    it "regards db connections as multiple" do
      expect(Carto::ConnectionManager.singleton_connector?(connection1)).to eq(false)
      expect(Carto::ConnectionManager.singleton_connector?(other_connection1)).to eq(false)
    end

    it "except for BQ db connections" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('bigquery')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'bigquery',
        connection_type: 'db-connector',
        parameters: {
          'billing_project' => 'the-billing-project',
          'service_account' => 'the-service-account'
        }
      )
      expect(Carto::ConnectionManager.singleton_connector?(connection)).to eq(true)
    end
  end

  describe '.errors' do
    it "reports invalid OAuth connector errors" do
      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'not-valid',
        connection_type: 'oauth-service',
        token: 'the-token'
      )
      errors = Carto::ConnectionManager.errors(connection)
      expect(errors).to include('Not a valid OAuth connector: not-valid')
    end

    it "reports invalid db connector errors" do
      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'not-valid',
        connection_type: 'db-connector',
        parameters: { 'server' => 'the-server' }
      )
      errors = Carto::ConnectionManager.errors(connection)
      expect(errors).to include('Not a valid DB connector: not-valid')
    end
  end

  describe '#check' do
    it "checks db connections" do
      Carto::Connector.provider_class('dummy').failing_with('BAD CONNECTION') do
        expect do
          connection_manager.check(connection1)
        end.to raise_exception(RuntimeError, /BAD CONNECTION/)
      end
    end

    it "checks oauth connections" do
      Carto::Connector.provider_class('dummy').failing_with('BAD CONNECTION') do
        Carto::ConnectionManager.any_instance.stubs(:oauth_connection_valid?).returns(true)
        expect(connection_manager.check(connection2)).to eq(true)
        Carto::ConnectionManager.any_instance.unstub(:oauth_connection_valid?)
      end
    end
  end


  describe "#manage_create" do
    after do
      $users_metadata.keys('gcloud_connections:*').each do |key|
        $users_metadata.del(key)
      end
    end

    it "saves snowflake db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves shared snowflake db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection_name = "#{organization.name}.a_connection"
      connection = mocked_record(
        id: '123',
        organization: organization,
        name: connection_name,
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: true
      )
      redis_json = $users_metadata.hget("cloud_shared_connections:#{organization.name}:#{connection.connector}", connection_name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_shared_connections:#{organization.name}:#{connection.connector}", connection_name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves redshift db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('redshift')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'redshift',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves postgres db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('postgres')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'postgres',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves bigquery db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('bigquery')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'bigquery',
        connection_type: 'db-connector',
        parameters: {
          'billing_project' => 'the-billing-project',
          'service_account' => 'the-service-account'
        },
        shared?: false
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'billing_project' => 'the-billing-project' })
      expect(redis_data['credentials']).to eq({ 'service_account' => 'the-service-account' })
    end

    it "does not save non-cloud db connections to redis" do
      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'dummy',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
        },
        shared?: false
      )
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
    end

    it "does not save oauth connections to redis" do
      connection_manager.manage_create(connection2)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection2.connector}", connection2.name)
      expect(redis_json).to be(nil)
    end

    it "except for BQ oauth connections" do
      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'bigquery',
        connection_type: 'oauth-service',
        token: 'the-token',
        parameters: {
          'billing_project' => 'the-billing-project'
        },
        shared?: false
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:bigquery", connection.name)
      expect(redis_json).to be(nil)
      Cartodb::Central.any_instance.stubs(:update_user)
      connection_manager.manage_create(connection)
      Cartodb::Central.any_instance.unstub(:update_user)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:bigquery", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'billing_project' => 'the-billing-project' })
      expect(redis_data['credentials']).to eq({ 'token' => 'the-token' })
    end
  end

  describe "#manage_destroy" do
    after do
      $users_metadata.keys('gcloud_connections:*').each do |key|
        $users_metadata.del(key)
      end
    end

    it "removes snowflake db connection data from redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false
      )
      $users_metadata.hset(
        "cloud_connections:#{user.username}:#{connection.connector}", connection.name, 'the-connection-data'
      )

      connection_manager.manage_destroy(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
    end

    it "only removes deleted snowflake connection" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false
      )
      $users_metadata.hset(
        "cloud_connections:#{user.username}:#{connection.connector}", connection.name, 'the-connection-data'
      )
      $users_metadata.hset(
        "cloud_connections:#{user.username}:#{connection.connector}", 'other_name', 'the-connection-data'
      )

      connection_manager.manage_destroy(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", 'other_name')
      expect(redis_json).not_to be(nil)
    end
  end

  describe "#manage_update" do
    after do
      $users_metadata.keys('gcloud_connections:*').each do |key|
        $users_metadata.del(key)
      end
    end

    it "updates snowflake db connection data in redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false,
        changes: {}
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-new-password'
        },
        shared?: false,
        changes: {}
      )
      connection_manager.manage_update(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-new-password' })
    end

    it "moves data in redis when connection name changes" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = mocked_record(
        id: '123',
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          'server' => 'the-server',
          'database' => 'the-database',
          'username' => 'the-username',
          'password' => 'the-password'
        },
        shared?: false,
        changes: {}
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })

      old_name = connection.name
      new_name = 'a_different_name'
      connection.name = new_name
      connection.changes[:name] = [old_name, new_name]
      connection_manager.manage_update(connection)
      old_redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", old_name)
      expect(old_redis_json).to be(nil)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", new_name)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end
  end
end
