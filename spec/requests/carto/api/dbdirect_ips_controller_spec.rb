require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'
require 'spec_helper'

describe Carto::Api::DbdirectIpsController do
  include_context 'users helper'
  include HelperMethods
  include FeatureFlagHelper
  include Rack::Test::Methods

  before(:all) do
    host! "#{@carto_user1.username}.localhost.lan"
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'dbdirect', restricted: true)

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
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
    end

    it 'needs authentication for ips creation' do
      params = {
        ips: ['100.20.30.40']
      }
      put_json(dbdirect_ip_url, params) do |response|
        expect(response.status).to eq(401)
        expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
      end
    end

    it 'needs the feature flag for ips creation' do
        params = {
          ips: ['100.20.30.40'],
          api_key: @carto_user1.api_key
        }
        with_feature_flag @carto_user1, 'dbdirect', false do
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(403)
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
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
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
        end
      end
    end

    it 'creates ips with login authentication' do
      ips = ['100.20.30.40']
      params = {
        ips: ips
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        login_as(@carto_user1, scope: @carto_user1.username)
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips
        end
      end
    end

    it 'retains only latest ips assigned' do
      ips1 = ['100.20.30.40', '200.20.30.40/24']
      ips2 = ['11.21.31.41']
      with_feature_flag @carto_user1, 'dbdirect', true do
        params = {
          ips: ips1,
          api_key: @carto_user1.api_key
        }
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips1
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips1
        end

        params = {
          ips: ips2,
          api_key: @carto_user1.api_key
        }
        put_json(dbdirect_ip_url, params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips2
          expect(@carto_user1.reload.dbdirect_effective_ips).to eq ips2
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
          put_json(dbdirect_ip_url, params) do |response|
            expect(response.status).to eq(422)
            expect(response.body[:errors]).not_to be_nil
            expect(response.body[:errors][:ips]).not_to be_nil
            expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
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
          put_json dbdirect_ip_url(params.merge(host: host)) do |response|
            expect(response.status).to eq(201)
            expect(response.body[:ips]).to eq ips
            expect(@org_user.reload.dbdirect_effective_ips).to eq ips
            expect(@org_owner.reload.dbdirect_effective_ips).to eq ips
          end
        end
      end
    end
  end

  describe '#destroy' do
    before(:each) do
      @params = { api_key: @carto_user1.api_key }
      @existing_ips = ['100.20.30.40']
      @carto_user1.dbdirect_effective_ips = @existing_ips
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
    end

    it 'needs authentication for ips deletion' do
      params = {}
      delete_json dbdirect_ip_url(params) do |response|
        expect(response.status).to eq(401)
        expect(@carto_user1.reload.dbdirect_effective_ips).not_to be_empty
      end
    end

    it 'needs the feature flag for ips deletion' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', false do
        delete_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(403)
          expect(@carto_user1.reload.dbdirect_effective_ips).not_to be_empty
        end
      end
    end

    it 'deletes ips with api_key authentication' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        delete_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(204)
          expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
        end
      end
    end

    it 'deletes ips with login authentication' do
      params = {
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        login_as(@carto_user1, scope: @carto_user1.username)
        delete_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(204)
          expect(@carto_user1.reload.dbdirect_effective_ips).to be_empty
        end
      end
    end
  end

  describe '#show' do
    before(:each) do
      @ips = ['100.20.30.40']
      @carto_user1.dbdirect_effective_ips = @ips
    end

    after(:each) do
      Carto::DbdirectCertificate.delete_all
    end

    it 'needs authentication for showing ips' do
      params = {
      }
      get_json dbdirect_ip_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'needs the feature flag for showing ips' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', false do
        get_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(403)
        end
      end
    end

    it 'shows ips with api key authentication' do
      params = {
        api_key: @carto_user1.api_key
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        get_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:ips]).to eq @ips
        end
      end
    end

    it 'shows ips with login authentication' do
      params = {
      }
      with_feature_flag @carto_user1, 'dbdirect', true do
        login_as(@carto_user1, scope: @carto_user1.username)
        get_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:ips]).to eq @ips
        end
      end
    end

    it 'returns empty ips array when not configured' do
      params = {
        api_key: @carto_user1.api_key
      }
      @carto_user1.reload.dbdirect_effective_ips = nil
      with_feature_flag @carto_user1, 'dbdirect', true do
        get_json dbdirect_ip_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:ips]).to eq []
        end
      end
    end
  end
end
