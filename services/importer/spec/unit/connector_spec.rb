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
    Carto::Connector::PROVIDERS << DummyConnectorProvider
    Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('another_dummy')
    Carto::Connector::PROVIDERS << dummy_connector_provider_with_id('third_dummy')
    Carto::Connector.providers.keys.each do |provider_name|
      Carto::ConnectorProvider.create! name: provider_name
    end
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  around(:each) do |example|
    Cartodb.with_config(connectors: {}, &example)
  end

  after(:all) do
    @user.destroy
    Carto::Connector.providers.keys.each do |provider_name|
      Carto::ConnectorProvider.find_by_name(provider_name).destroy
    end
  end

  it "Should list providers available for a user with default configuration" do
    default_config = { 'dummy' => { 'enabled' => true }, 'another_dummy' => { 'enabled' => false } }
    Cartodb.with_config connectors: default_config do
      Carto::Connector.providers(user: @user).should == {
        "dummy"         => { name: "Dummy",         enabled: true,  description: nil },
        "another_dummy" => { name: "another_dummy", enabled: false, description: nil },
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
end
