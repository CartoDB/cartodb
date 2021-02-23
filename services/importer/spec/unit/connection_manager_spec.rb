require_relative '../../../../spec/spec_helper'
require_relative '../doubles/connector'

describe Carto::ConnectionManager do

  let(:user) { create(:carto_user_light) }
  let(:connection_manager) { Carto::ConnectionManager.new(user) }

  before(:all) do
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
end
