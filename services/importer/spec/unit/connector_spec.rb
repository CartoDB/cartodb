require 'carto/connector'
require_relative '../../../../spec/spec_helper'

require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative '../doubles/connector'

describe Carto::Connector do
  before(:all) do
    @user = create_user
    @user.save
    @fake_log = CartoDB::Importer2::Doubles::Log.new(@user)
    @previous_providers = replace_connector_providers(
      DummyConnectorProvider,
      dummy_connector_provider_with_id('another_dummy'),
      dummy_connector_provider_with_id('third_dummy'),
      DummyConnectorProviderWithModifiedDate
    )
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  around(:each) do |example|
    Cartodb.with_config(connectors: {}, &example)
  end

  after(:all) do
    @user.destroy
    restore_connector_providers(@previous_providers)
  end

  it "Should list providers available for a user with default configuration" do
    default_config = { 'dummy' => { 'enabled' => true }, 'another_dummy' => { 'enabled' => false } }
    Cartodb.with_config connectors: default_config do
      Carto::Connector.providers(user: @user).should == {
        "dummy"         => { name: "Dummy",         enabled: true,  description: nil },
        "another_dummy" => { name: "another_dummy", enabled: false, description: nil },
        "dummy_with_modified_date" => { name: "DummyWithModifiedDate", enabled: false, description: nil },
        "third_dummy"   => { name: "third_dummy",   enabled: false, description: nil }
      }
    end
  end

  it "Should list providers available for a user with specific configuration" do
    default_config = { 'dummy' => { 'enabled' => true }, 'another_dummy' => { 'enabled' => false } }
    dummy = Carto::ConnectorProvider.find_by_name('dummy')
    user_config = Carto::ConnectorConfiguration.create!(
      connector_provider_id: dummy.id,
      user_id: @user.id,
      enabled: true
    )
    Cartodb.with_config connectors: default_config do
      Carto::Connector.providers(user: @user).should == {
        "dummy"         => { name: "Dummy",         enabled: true,  description: nil },
        "another_dummy" => { name: "another_dummy", enabled: false, description: nil },
        "dummy_with_modified_date" => { name: "DummyWithModifiedDate", enabled: false, description: nil },
        "third_dummy" => { name: "third_dummy",     enabled: false, description: nil }
      }
    end
    user_config.destroy
  end

  it 'Should provide connector metadata' do
    Carto::Connector.information('dummy').should == {
      features: {
        'list_tables':    true,
        'list_databases': false,
        'sql_queries':    false,
        'preview_table':  false,
        'dry_run':        false,
        'list_projects':  false
      },
      parameters: {
        'table' => {required:  true },
        'req1'  => {required:  true },
        'req2'  => {required:  true },
        'opt1'  => {required:  false },
        'opt2'  => {required:  false }
      }
    }
  end

  it 'Should not provide metadata for an invalid provider' do
    expect {
      Carto::Connector.information('not_a_provider')
    }.to raise_error(Carto::Connector::InvalidParametersError)
  end

  it 'Should instantiate a provider' do
    parameters = {
      provider: 'dummy',
      table:    'thetable',
      req1: 'a',
      req2: 'b',
      opt1: 'c'
    }
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log)
    connector.should_not be nil
    connector.provider_name.should eq 'dummy'
  end

  it 'Should fail to instantiate an invalid provider' do
    parameters = {
      provider: 'invalid',
      table:    'thetable',
      req1: 'a',
      req2: 'b',
      opt1: 'c'
    }
    expect {
      Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log)
    }.to raise_error(Carto::Connector::InvalidParametersError)
  end

  it 'By default providers consider data modified' do
    parameters = {
      provider: 'dummy',
      table:    'thetable',
      req1: 'a',
      req2: 'b',
      opt1: 'c'
    }
    future = Time.now + 1
    past = Time.new(0)
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log)
    connector.remote_data_updated?.should eq true
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log, previous_last_modified: future)
    connector.remote_data_updated?.should eq true
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log, previous_last_modified: past)
    connector.remote_data_updated?.should eq true
  end

  it 'Providers can detect data modifications' do
    parameters = {
      provider: DummyConnectorProviderWithModifiedDate.provider_id,
      table:    'thetable',
      req1: 'a',
      req2: 'b',
      opt1: 'c'
    }
    same_date = DummyConnectorProviderWithModifiedDate::LAST_MODIFIED
    prior_date = same_date - 1
    posterior_date = same_date + 1
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log)
    connector.remote_data_updated?.should eq true
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log, previous_last_modified: prior_date)
    connector.remote_data_updated?.should eq true
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log, previous_last_modified: posterior_date)
    connector.remote_data_updated?.should eq false
    connector = Carto::Connector.new(parameters: parameters, user: @user, logger: @fake_log, previous_last_modified: same_date)
    connector.remote_data_updated?.should eq false
  end
end
