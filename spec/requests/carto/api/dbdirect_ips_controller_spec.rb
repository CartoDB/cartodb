require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'
require 'spec_helper'

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
    @feature_flag = create(:feature_flag, name: 'dbdirect', restricted: true)
    @config = {
      metadata_persist: {
        enabled: true,
        prefix_namespace: 'dbdirect_test:',
        hash_key: 'ips'
      }
    }.with_indifferent_access

    @sequel_organization = create(:organization_with_users)
    @organization = Carto::Organization.find(@sequel_organization.id)
    @org_owner = @organization.owner
    @org_user = @organization.users.reject { |u| u.id == @organization.owner_id }.first
    @dbdirect_metadata = Carto::Dbdirect::MetadataManager.new(@config['metadata_persist'], $users_metadata)
  end

  after(:all) do
    @feature_flag.destroy
    @organization.destroy
    @dbdirect_metadata.reset(@carto_user1.username)
    @dbdirect_metadata.reset(@org_owner.username)
  end

  after(:each) do
    logout
  end

  describe '#update' do
    before(:each) do
      @params = { api_key: @carto_user1.api_key }
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
      @dbdirect_metadata.reset(@carto_user1.username)
    end

    it 'needs authentication for ips creation' do
      params = {
        ips: ['100.20.30.40']
      }
      Cartodb.with_config dbdirect: @config do
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(401)
          expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
          expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq ips
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq ips
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq ips1
          end

          params = {
            ips: ips2,
            api_key: @carto_user1.api_key
          }
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips2
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips2
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq ips2
          end
        end
      end
    end

    it 'rejects invalid IPs' do
      invalid_ips = [
        ['10.20.30.40'], ['127.0.0.1'], ['192.168.1.1'],
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
              expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
            end
          end
        end

      end
    end

    it 'IP ranges in metadata database are normalized' do
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq normalized_ips
          end
        end
      end
    end

    it 'IP changes affect only to org user, not org admin' do
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
              expect(@org_owner.reload.dbdirect_effective_ips).to be_empty
              expect(@dbdirect_metadata.get(@org_owner.username)).to be_empty
              expect(@dbdirect_metadata.get(@org_user.username)).to eq ips
            end
          end
        end
      end
    end

    it 'skip metadata persist if not enabled' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @carto_user1.api_key
      }
      config = {
        metadata_persist: {
          enabled: false
        }
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        Cartodb.with_config dbdirect: config do
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
            expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
          end
        end
      end
    end
  end

  describe '#destroy' do
    before(:each) do
      @params = { api_key: @carto_user1.api_key }
      @existing_ips = ['100.20.30.40']
      Cartodb.with_config dbdirect: @config do
        @carto_user1.dbdirect_effective_ips = @existing_ips
        @dbdirect_metadata.save(@carto_user1.username, @existing_ips)
      end
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
      @dbdirect_metadata.reset(@carto_user1.username)
    end

    it 'needs authentication for ips deletion' do
      params = {}
      Cartodb.with_config dbdirect: @config do
        delete_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(401)
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq @existing_ips
          expect(@dbdirect_metadata.get(@carto_user1.username)).to eq @existing_ips
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq @existing_ips
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to be_empty
          end
        end
      end
    end

    it 'skip metadata persist if not enabled' do
      config = {
        metadata_persist: {
          enabled: false
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
            expect(@dbdirect_metadata.get(@carto_user1.username)).to eq @existing_ips
          end
        end
      end
    end
  end

  describe '#show' do
    before(:each) do
      @ips = ['100.20.30.40']
      Cartodb.with_config dbdirect: @config do
        @carto_user1.dbdirect_effective_ips = @ips
      end
    end

    after(:each) do
      Carto::DbdirectCertificate.delete_all
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
