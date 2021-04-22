require 'spec_helper_unit'
require_relative '../../../services/importer/spec/doubles/connector'

describe Carto::Connection do
  include_context 'with MessageBroker stubs'

  let(:user) { create(:carto_user_light) }
  let(:fake_log) { CartoDB::Importer2::Doubles::Log.new(user) }

  around do |example|
    config = { 'dummy' => { 'enabled' => true } }

    Cartodb.with_config(connectors: config) do
      with_connector_providers(DummyConnectorProvider, incremental: true, &example)
    end
  end

  describe 'connection type is automatically computed' do
    #  TODO: this could be removed since it's testing ConnectionManager

    it 'is db if parameters are present' do
      connection = create(:connection, name: 'dumb', connector: 'dummy', parameters: {server: 'server'}, user: user)
      expect(connection.connection_type).to eq(Carto::Connection::TYPE_DB_CONNECTOR)
    end

    it 'is oauth if token is present' do
      connection = create(:connection, name: 'dumb', connector: 'gdrive', token: 'token', user: user)
      expect(connection.connection_type).to eq(Carto::Connection::TYPE_OAUTH_SERVICE)
    end
  end

  describe 'Some connectors have singleton connections' do
    # TODO: move this to ConnectionManager tests; mock (with spy) ConnectionManager here

    it 'has singleton connections for OAuth' do
      create(:connection, name: 'oauth1', connector: 'gdrive', token: 'token1', user: user)
      expect do
        Carto::Connection.create!(
          user: user,
          name: 'oauth2',
          connector: 'gdrive',
          token: 'token2'
        )
      end.to raise_exception(ActiveRecord::RecordInvalid, /Connector has already been taken/i)
    end

    it 'support multiple connections for db connectors' do
      connection1 = Carto::Connection.create!(
        user: user,
        name: 'db1',
        connector: 'dummy',
        parameters: { server: 'server1' }
      )
      connection2 = Carto::Connection.create!(
        user: user,
        name: 'db2',
        connector: 'dummy',
        parameters: { server: 'server1' }
      )
      expect(connection1.id).not_to eq(connection2.id)
    end

    it 'specific dbs can have singleton connections' do
      Carto::ConnectionManager.stubs(:singleton_connector?).returns(true)

      connection = create(
        :connection,
        user: user,
        name: 'sdb1',
        connector: 'dummy',
        parameters: { server: 'server1' }
      )
      expect do
        Carto::Connection.create!(
          user: user,
          name: 'sdb2',
          connector: 'dummy',
          parameters: { server: 'server2' }
        )
      end.to raise_exception(ActiveRecord::RecordInvalid, /Connector has already been taken/i)

      Carto::ConnectionManager.unstub(:singleton_connector?)
    end
  end

  describe 'ConnectionManager handles connction lifecycle' do

    let(:connection_manager) { mock }

    before do
      Carto::ConnectionManager.stubs(:new).with(user).returns(connection_manager)
    end

    it 'calls manage_create for new connections' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection_manager.stubs(:manage_prevalidation)
      connection = build(
        :connection,
        name: 'dumb',
        connector: 'dummy',
        connection_type: Carto::Connection::TYPE_DB_CONNECTOR,
        parameters: parameters,
        user: user
      )
      connection_manager.expects(:manage_create).with(connection)
      connection.save!
    end

    it 'calls manage_destroy for destroyed connections' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection_manager.stubs(:manage_prevalidation)
      connection = build(
        :connection,
        name: 'dumb',
        connector: 'dummy',
        connection_type: Carto::Connection::TYPE_DB_CONNECTOR,
        parameters: parameters,
        user: user
      )
      connection_manager.expects(:manage_create).with(connection)
      connection.save!

      connection_manager.expects(:manage_destroy).with(connection)
      connection.destroy!
    end

    it 'calls manage_update for updated connections' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection_manager.stubs(:manage_prevalidation)
      connection = build(
        :connection,
        name: 'dumb',
        connector: 'dummy',
        connection_type: Carto::Connection::TYPE_DB_CONNECTOR,
        parameters: parameters,
        user: user
      )
      connection_manager.expects(:manage_create).with(connection)
      connection.save!

      connection_manager.expects(:manage_update).with(connection)
      connection.update!(name: 'dumber')
    end

    it 'checks singletonness' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection_manager.stubs(:manage_prevalidation)
      connection = build(
        :connection,
        name: 'dumb2',
        connector: 'dummy',
        connection_type: Carto::Connection::TYPE_DB_CONNECTOR,
        parameters: parameters,
        user: user
      )
      connection_manager.expects(:manage_create).with(connection)
      Carto::ConnectionManager.expects(:singleton_connector?).with(connection).returns(false)
      connection.save!
      Carto::ConnectionManager.unstub(:singleton_connector?)
    end

    it 'checks for errors' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection_manager.stubs(:manage_prevalidation)
      connection = build(
        :connection,
        name: 'dumb',
        connector: 'dummy',
        connection_type: Carto::Connection::TYPE_DB_CONNECTOR,
        parameters: parameters,
        user: user
      )
      connection_manager.expects(:manage_create).with(connection)
      Carto::ConnectionManager.expects(:errors).with(connection).returns([])
      connection.save!
      Carto::ConnectionManager.unstub(:errors)
    end

    it 'performs prevalidation' do
      parameters = { server: 'server' }
      connection_manager.stubs(:adapt_db_connector_parameters).returns([parameters, parameters.merge(provider: 'dummy')])
      connection_manager.stubs(:check).returns(true)
      connection = build(:connection, name: 'dumb', connector: 'dummy', parameters: parameters, user: user)
      connection_manager.expects(:manage_prevalidation).with(connection)
      connection.valid?
    end
  end

  describe 'Validation' do

    it 'requires a name' do
      expect do
        Carto::Connection.create!(
          user: user,
          connector: 'dummy',
          parameters: { table: 't', req1: 'r1', req2: 'r2' }
        )
      end.to raise_exception(ActiveRecord::RecordInvalid)
    end

    it 'rejects invalid db connectors' do
      expect do
        Carto::Connection.create!(
          name: 'dummy',
          user: user,
          connector: 'invalid-connector',
          parameters: { server: 'x' }
        )
      end.to raise_exception(ActiveRecord::RecordInvalid, /invalid provider/i)
    end

    it 'checks db connector' do
      Carto::Connector.provider_class('dummy').failing_with('BAD CONNECTOR') do
        expect do
          Carto::Connection.create!(
            name: 'dummy',
            user: user,
            connector: 'dummy',
            parameters: { table: 't', req1: 'r1', req2: 'r2' }
          )
        end.to raise_exception(ActiveRecord::RecordInvalid, /BAD CONNECTOR/)
      end
    end
  end

  context 'with message broker' do
    let(:topic) { MessageBrokerDouble.instance.get_topic(:cartodb_central) }
    let(:connection) do
      build(:connection,
            name: 'dumb', connector: 'bigquery',
            connection_type: Carto::Connection::TYPE_OAUTH_SERVICE, user: user)
    end

    describe '#notify_central_bq_connection_created' do
      it 'notifies central about BQ created to grant access to DO' do
        topic.expects(:publish).once.with(
          :grant_do_full_access,
          { username: user.username, target_email: user.email }
        )
        connection.notify_central_bq_connection_created
      end
    end

    describe '#notify_central_bq_connection_deleted' do
      it 'notifies central about BQ deleted to revoke access from DO' do
        topic.expects(:publish).once.with(
          :revoke_do_full_access,
          { username: user.username, target_email: user.email }
        )
        connection.notify_central_bq_connection_deleted
      end
    end
  end
end
