require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'
require 'spec_helper'

class TestFirewallManager
  @rules = {}
  @config = nil
  class <<self
    attr_reader :rules, :config
    attr_writer :config
  end

  def initialize(config)
    @config = config
    TestFirewallManager.config = config
  end

  attr_reader :config

  def delete_rule(rule_name)
    raise "FIREWALL DELETE ERROR" unless TestFirewallManager.rules.has_key?(rule_name)
    TestFirewallManager.rules.delete rule_name
  end

  def create_rule(rule_name, ips)
    raise "FIREWALL CREATE ERROR" if TestFirewallManager.rules.has_key?(rule_name)
    TestFirewallManager.rules[rule_name] = ips
  end

  def update_rule(rule_name, ips)
    raise "FIREWALL UPDATE ERROR" unless TestFirewallManager.rules.has_key?(rule_name)
    TestFirewallManager.rules[rule_name] = ips
  end
end

class TestErrorFirewallManager
  def initialize(config)
  end

  def delete_rule(rule_name)
    raise "FIREWALL ERROR"
  end

  def create_rule(rule_name, ips)
    raise "FIREWALL ERROR"
  end

  def update_rule(rule_name, ips)
    raise "FIREWALL ERROR"
  end
end

describe Carto::Api::DbdirectIpsController do
  include_context 'users helper'
  include HelperMethods
  include FeatureFlagHelper
  include Rack::Test::Methods

  def rule(id)
    "<<#{id}>>"
  end

  before(:all) do
    host! "#{@carto_user1.username}.localhost.lan"
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'dbdirect', restricted: true)
    @config = {
      firewall: {
        enabled: true,
        rule_name: '<<{{id}}>>'
      }
    }.with_indifferent_access

    @sequel_organization = FactoryGirl.create(:organization_with_users)
    @organization = Carto::Organization.find(@sequel_organization.id)
    @org_owner = @organization.owner
    @org_user = @organization.users.reject { |u| u.id == @organization.owner_id }.first
  end

  after(:all) do
    @feature_flag.destroy
    @organization.destroy
  end

  after(:each) do
    logout
  end

  describe '#update' do
    before(:each) do
      @params = { api_key: @carto_user1.api_key }
      Carto::DbdirectIp.stubs(:firewall_manager_class).returns(TestFirewallManager)
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
      TestFirewallManager.rules.clear
      TestFirewallManager.config = nil
    end

    it 'needs authentication for ips creation' do
      params = {
        ips: ['100.20.30.40']
      }
      Cartodb.with_config dbdirect: @config do
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(401)
          expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
          expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
        end
      end
    end

    it 'needs the feature flag for ips creation' do
        params = {
          ips: ['100.20.30.40'],
          api_key: @carto_user1.api_key
        }
        with_feature_flag @carto_user1, 'dbdirect', false do
          Cartodb.with_config dbdirect: @config do
            put_json(dbdirect_ip_url, params) do |response|
              expect(response.status).to eq(403)
              expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
              expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
            end
          end
        end
    end

    it 'creates ips with api_key authentication' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq ips
            expect(TestFirewallManager.config).to eq @config[:firewall]
            expect(@carto_user1.dbdirect_effective_ip.firewall_rule_name).to eq rule(@carto_user1.username)
          end
        end
      end
    end

    it 'creates ips with login authentication' do
      ips = ['100.20.30.40']
      params = {
        ips: ips
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          login_as(@carto_user1, scope: @carto_user1.username)
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq ips
            expect(TestFirewallManager.config).to eq @config[:firewall]
            expect(@carto_user1.dbdirect_effective_ip.firewall_rule_name).to eq rule(@carto_user1.username)
          end
        end
      end
    end

    it 'retains only latest ips assigned' do
      ips1 = ['100.20.30.40', '200.20.31.0/24']
      ips2 = ['11.21.31.41']
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          params = {
            ips: ips1,
            api_key: @carto_user1.api_key
          }
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips1
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips1
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq ips1
            expect(TestFirewallManager.config).to eq @config[:firewall]
            expect(@carto_user1.dbdirect_effective_ip.firewall_rule_name).to eq rule(@carto_user1.username)
          end

          params = {
            ips: ips2,
            api_key: @carto_user1.api_key
          }
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips2
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips2
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq ips2
            expect(TestFirewallManager.config).to eq @config[:firewall]
            expect(@carto_user1.dbdirect_effective_ip.firewall_rule_name).to eq rule(@carto_user1.username)
          end
        end
      end
    end

    it 'rejects invalid IPs' do
      invalid_ips = [
        ['0.0.0.0'], ['10.20.30.40'], ['127.0.0.1'], ['192.168.1.1'],
        ['120.120.120.120/20'], ['100.100.100.300'], ['not-an-ip'],
        [11223344],
        '100.20.30.40'
      ]
      invalid_ips.each do |ips|
        params = {
          ips: ips,
          api_key: @carto_user1.api_key
        }

        with_feature_flag @carto_user1, 'dbdirect', true do
          Cartodb.with_config dbdirect: @config do
            put_json(dbdirect_ip_url, params) do |response|
              expect(response.status).to eq(422)
              expect(response.body[:errors]).not_to be_nil
              expect(response.body[:errors][:ips]).not_to be_nil
              expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
              expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
            end
          end
        end

      end
    end

    it 'IP ranges in firewall are normalized' do
      ips = ['100.20.30.40', '12.12.12.12/24']
      normalized_ips = ['100.20.30.40', '12.12.12.0/24']
      params = {
        ips: ips
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          login_as(@carto_user1, scope: @carto_user1.username)
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq normalized_ips
            expect(TestFirewallManager.config).to eq @config[:firewall]
            expect(@carto_user1.dbdirect_effective_ip.firewall_rule_name).to eq rule(@carto_user1.username)
          end
        end
      end
    end

    it 'IP changes affect all the organization members' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @org_user.api_key
      }
      with_host "#{@org_user.username}.localhost.lan" do
        with_feature_flag @org_user, 'dbdirect', true do
          Cartodb.with_config dbdirect: @config do
            put_json dbdirect_ip_url(params.merge(host: host)) do |response|
              expect(response.status).to eq(201)
              expect(response.body[:ips]).to eq ips
              expect(@org_user.reload.dbdirect_effective_ips).to eq ips
              expect(@org_owner.reload.dbdirect_effective_ips).to eq ips
              expect(TestFirewallManager.rules[rule(@organization.name)]).to eq ips
              expect(TestFirewallManager.rules[rule(@org_user.username)]).to be_nil
              expect(TestFirewallManager.rules[rule(@org_owner.username)]).to be_nil
              expect(TestFirewallManager.config).to eq @config[:firewall]
              expect(@org_user.dbdirect_effective_ip.firewall_rule_name).to eq rule(@organization.name)
              expect(@org_owner.dbdirect_effective_ip.firewall_rule_name).to eq rule(@organization.name)
            end
          end
        end
      end
    end

    it 'returns error response if firewall service fails' do
      Carto::DbdirectIp.stubs(:firewall_manager_class).returns(TestErrorFirewallManager)
      ips = ['100.20.30.40']
      params = {
        ips: ips
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          login_as(@carto_user1, scope: @carto_user1.username)
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(500)
            expect(response.body[:errors]).to match(/FIREWALL ERROR/)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
          end
        end
      end
    end

    it 'omits firewall management if not enabled' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @carto_user1.api_key
      }
      config = {
        firewall: {
          enabled: false,
          rule_name: '<<{{id}}>>'
        }
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: config do
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(TestFirewallManager.rules).to be_empty
            expect(TestFirewallManager.config).to be_nil
          end
        end
      end
    end

    it 'omits firewall management by default' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: {} do
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(TestFirewallManager.rules).to be_empty
            expect(TestFirewallManager.config).to be_nil
          end
        end
      end
    end
  end

  describe '#destroy' do
    before(:each) do
      @params = { api_key: @carto_user1.api_key }
      @existing_ips = ['100.20.30.40']
      Carto::DbdirectIp.stubs(:firewall_manager_class).returns(TestFirewallManager)
      Cartodb.with_config dbdirect: @config do
        @carto_user1.dbdirect_effective_ips = @existing_ips
        TestFirewallManager.rules[rule(@carto_user1.username)] = @existing_ips
      end
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
      TestFirewallManager.rules.clear
      TestFirewallManager.config = nil
    end

    it 'needs authentication for ips deletion' do
      params = {}
      Cartodb.with_config dbdirect: @config do
        delete_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(401)
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq @existing_ips
          expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq @existing_ips
        end
      end
    end

    it 'needs the feature flag for ips deletion' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', false do
        Cartodb.with_config dbdirect: @config do
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(403)
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq @existing_ips
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq @existing_ips
          end
        end
      end
    end

    it 'deletes ips with api_key authentication' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(204)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
            expect(TestFirewallManager.config).to eq @config[:firewall]
          end
        end
      end
    end

    it 'deletes ips with login authentication' do
      params = {
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          login_as(@carto_user1, scope: @carto_user1.username)
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(204)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to be_nil
            expect(TestFirewallManager.config).to eq @config[:firewall]
          end
        end
      end
    end

    it 'returns error response if firewall service fails' do
      Carto::DbdirectIp.stubs(:firewall_manager_class).returns(TestErrorFirewallManager)
      params = {
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          login_as(@carto_user1, scope: @carto_user1.username)
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(500)
            expect(response.body[:errors]).to match(/FIREWALL ERROR/)
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq @existing_ips
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq @existing_ips
          end
        end
      end
    end

    it 'omits firewall management if not enabled' do
      config = {
        firewall: {
          enabled: false,
          rule_name: '<<{{id}}>>'
        }
      }
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: config do
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(204)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq @existing_ips
          end
        end
      end
    end

    it 'omits firewall management by default' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: {} do
          delete_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(204)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
            expect(TestFirewallManager.rules[rule(@carto_user1.username)]).to eq @existing_ips
          end
        end
      end
    end
  end

  describe '#show' do
    before(:each) do
      @ips = ['100.20.30.40']
      Carto::DbdirectIp.stubs(:firewall_manager_class).returns(TestFirewallManager)
      Cartodb.with_config dbdirect: @config do
        @carto_user1.dbdirect_effective_ips = @ips
      end
      TestFirewallManager.rules[rule(@carto_user1.username)] = @ips
    end

    after(:each) do
      Carto::DbdirectCertificate.delete_all
      TestFirewallManager.rules.clear
      TestFirewallManager.config = nil
    end

    it 'needs authentication for showing ips' do
      params = {
      }
      Cartodb.with_config dbdirect: @config do
        get_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(401)
        end
      end
    end

    it 'needs the feature flag for showing ips' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', false do
        Cartodb.with_config dbdirect: @config do
          get_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(403)
          end
        end
      end
    end

    it 'shows ips with api key authentication' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          get_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:ips]).to eq @ips
          end
        end
      end
    end

    it 'shows ips with login authentication' do
      params = {
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        login_as(@carto_user1, scope: @carto_user1.username)
        Cartodb.with_config dbdirect: @config do
          get_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:ips]).to eq @ips
          end
        end
      end
    end

    it 'returns empty ips array when not configured' do
      params = {
        api_key: @carto_user1.api_key
      }
      Cartodb.with_config dbdirect: @config do
        @carto_user1.reload.dbdirect_effective_ips = nil
      end
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: @config do
          get_json dbdirect_ip_url(params) do |response|
            expect(response.status).to eq(200)
            expect(response.body[:ips]).to eq []
          end
        end
      end
    end
  end
end
