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
end

