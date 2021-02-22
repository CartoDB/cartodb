require_relative '../../../../spec/spec_helper'
require_relative '../doubles/connector'

describe Carto::ConnectionManager do

  let(:user) { create(:carto_user) }
  let(:connection_manager) { Carto::ConnectionManager.new(user) }

  before(:all) do
    # TODO: remove providers, add dummy providers: (requires parameter changes/adapting the dummy)
    #   Carto::Connector::PROVIDERS.clear
    #   Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('snowflake')
    #   Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('redshift')
    #   Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('postgres')
    #   Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('bigquery')
    Carto::Connector::PROVIDERS << DummyConnectorProvider
    Carto::Connector.providers.keys.each do |provider_name|
      Carto::ConnectorProvider.create! name: provider_name
    end
  end

  around(:each) do |example|
    config = { 'dummy' => { 'enabled' => true } }
    Cartodb.with_config(connectors: config, &example)
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

  describe "#list_connections" do
    it "presents all user connections" do
      expected_connections = [
        { id: connection1.id, name: connection1.name, connector: connection1.connector,
          type: connection1.connection_type, parameters: connection1.parameters },
        { id: connection2.id, name: connection2.name, connector: connection2.connector,
          type: connection2.connection_type, token: '********' },
        { id: connection3.id, name: connection3.name, connector: connection3.connector,
          type: connection3.connection_type, token: '********' }
      ]
      connections = connection_manager.list_connections.sort_by { |c| c['name'] }
      expect(connections).to eq(expected_connections)
    end
  end

  describe "#show_connection" do
    it "presents a single connection" do
      expected_connection = {
        id: connection1.id, name: connection1.name, connector: connection1.connector,
        type: connection1.connection_type, parameters: connection1.parameters
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
    it "creates new connections" do
      connection = connection_manager.create_db_connection(
        name: 'new_connection',
        provider: connection1.connector,
        parameters: connection1.parameters
      )
      expect(connection.id).not_to eq(connection1.id)
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

  describe "#manage_create" do
    after do
      $users_metadata.keys('gcloud_connections:*').each do |key|
        $users_metadata.del(key)
      end
    end

    it "saves snowflake db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('snowflake')

      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          server: 'the-server', database: 'the-database', username: 'the-username', password: 'the-password'
        }
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves redshift db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('redshift')

      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'redshift',
        connection_type: 'db-connector',
        parameters: {
          server: 'the-server', database: 'the-database', username: 'the-username', password: 'the-password'
        }
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves postgres db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('postgres')

      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'postgres',
        connection_type: 'db-connector',
        parameters: {
          server: 'the-server', database: 'the-database', username: 'the-username', password: 'the-password'
        }
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'server' => 'the-server', 'database' => 'the-database' })
      expect(redis_data['credentials']).to eq({ 'username' => 'the-username', 'password' => 'the-password' })
    end

    it "saves bigquery db connection data to redis" do
      pending('db-connectors required for this test') unless Carto::Connector.providers.keys.include?('bigquery')

      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'bigquery',
        connection_type: 'db-connector',
        parameters: {
          billing_project: 'the-billing-project', service_account: 'the-service-account'
        }
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      redis_data = JSON.parse(redis_json)
      expect(redis_data['connection_id']).to eq(connection.id)
      expect(redis_data['connection_type']).to eq(connection.connection_type)
      expect(redis_data['connector']).to eq(connection.connector)
      expect(redis_data['options']).to eq({ 'billing_project' => 'the-billing-project' })
      expect(redis_data['credentials']).to eq({ 'service_account' => 'the-service-account' })
    end

    it "does not save non-cloud db connections to redis" do
      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'dummy',
        connection_type: 'db-connector',
        parameters: { server: 'the-server', password: 'the-password' }
      )
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).to be(nil)
    end

    it "does not save oauth connections to redis" do
      connection_manager.manage_create(connection2)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection2.connector}", connection2.id)
      expect(redis_json).to be(nil)
    end

    it "except for BQ oauth connections" do
      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'bigquery',
        connection_type: 'oauth-service',
        token: 'the-token',
        parameters: { billing_project: 'the-billing-project' }
      )
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:bigquery", connection.id)
      expect(redis_json).to be(nil)
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:bigquery", connection.id)
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

      connection = create(
        :connection,
        user: user,
        name: 'a_connection',
        connector: 'snowflake',
        connection_type: 'db-connector',
        parameters: {
          server: 'the-server', database: 'the-database', username: 'the-username', password: 'the-password'
        }
      )
      connection_manager.manage_create(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).not_to be(nil)

      connection_manager.manage_destroy(connection)
      redis_json = $users_metadata.hget("cloud_connections:#{user.username}:#{connection.connector}", connection.id)
      expect(redis_json).not_to be(nil)
    end
  end

  # TODO: manage_update

end
