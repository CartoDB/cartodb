require 'spec_helper_min'
require 'support/helpers'
require 'helpers/feature_flag_helper'

describe Carto::Api::DbdirectIpsController do
  include_context 'users helper'
  include HelperMethods
  include FeatureFlagHelper

  before(:all) do
    host! "#{@user1.username}.localhost.lan"
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'dbdirect', restricted: true)
  end

  after(:all) do
    @feature_flag.destroy
  end

  after(:each) do
    logout
  end

  describe '#update' do
    before(:each) do
      @params = { api_key: @user1.api_key }
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
    end

    # TODO: check valid/invalid ips list syntax
    # TODO: organization tests

    it 'needs authentication for ips creation' do
      params = {
        ips: ['100.20.30.40']
      }
      post_json api_v1_dbdirect_ips_update_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'needs the feature flag for ips creation' do
        params = {
          ips: ['100.20.30.40'],
          api_key: @user1.api_key
        }
        with_feature_flag @user1, 'dbdirect', false do
          post_json api_v1_dbdirect_ips_update_url(params) do |response|
            expect(response.status).to eq(403)
          end
        end
    end

    it 'creates ips with api_key authentication' do
      ips = ['100.20.30.40']
      params = {
        ips: ips,
        api_key: @user1.api_key
      }
      with_feature_flag @user1, 'dbdirect', true do
        post_json api_v1_dbdirect_ips_update_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips
          expect(Carto::User.find(@user1.id).dbdirect_effective_ips).to eq ips
        end
      end
    end

    it 'creates ips with login authentication' do
      ips = ['100.20.30.40']
      params = {
        ips: ips
      }
      with_feature_flag @user1, 'dbdirect', true do
        login_as(@user1, scope: @user1.username)
        post_json api_v1_dbdirect_ips_update_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips
          expect(Carto::User.find(@user1.id).dbdirect_effective_ips).to eq ips
        end
      end
    end

    it 'retains only latest ips assigned' do
      ips1 = ['100.20.30.40', '200.20.30.40/24']
      ips2 = ['11.21.31.41']
      with_feature_flag @user1, 'dbdirect', true do
        params = {
          ips: ips1,
          api_key: @user1.api_key
        }
        post_json api_v1_dbdirect_ips_update_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips1
          expect(Carto::User.find(@user1.id).dbdirect_effective_ips).to eq ips1
        end

        params = {
          ips: ips2,
          api_key: @user1.api_key
        }
        post_json api_v1_dbdirect_ips_update_url(params) do |response|
          expect(response.status).to eq(201)
          expect(response.body[:ips]).to eq ips2
          expect(Carto::User.find(@user1.id).dbdirect_effective_ips).to eq ips2
        end
      end
    end

    it 'rejects invalid IPs' do
      invalid_ips = [
        '0.0.0.0', '10.20.30.40', '127.0.0.1', '192.168.1.1', '120.120.120.120/20', '100.100.100.300', 'not-an-ip'
      ]
      invalid_ips.each do |ip|
        params = {
          ips: [ip],
          api_key: @user1.api_key
        }
        with_feature_flag @user1, 'dbdirect', true do
          post_json api_v1_dbdirect_ips_update_url(params) do |response|
            expect(response.status).to eq(422)
            expect(response.body[:errors]).not_to be_nil
            expect(response.body[:errors][:ips]).not_to be_nil
            expect(Carto::User.find(@user1.id).dbdirect_effective_ips).to be_nil
          end
        end

      end
    end
  end

  describe '#destroy' do
    before(:each) do
      @params = { api_key: @user1.api_key }
      @existing_ips = ['100.20.30.40']
      Carto::User.find_by_id(@user1.id).dbdirect_effective_ips = @existing_ips
    end

    after(:each) do
      Carto::DbdirectIp.delete_all
    end

    it 'needs authentication for ips deletion' do
      params = {}
      delete_json api_v1_dbdirect_ips_destroy_url(params) do |response|
        expect(response.status).to eq(401)
        expect(Carto::User.find_by_id(@user1.id).dbdirect_effective_ips).not_to be_nil
      end
    end

    it 'needs the feature flag for ips deletion' do
      params = {
        api_key: @user1.api_key
      }
      with_feature_flag @user1, 'dbdirect', false do
        delete_json api_v1_dbdirect_ips_destroy_url(params) do |response|
          expect(response.status).to eq(403)
          expect(Carto::User.find_by_id(@user1.id).dbdirect_effective_ips).not_to be_nil
        end
      end
    end

    it 'deletes ips with api_key authentication' do
      params = {
        api_key: @user1.api_key
      }
      with_feature_flag @user1, 'dbdirect', true do
        delete_json api_v1_dbdirect_ips_destroy_url(params) do |response|
          expect(response.status).to eq(204)
          expect(Carto::User.find_by_id(@user1.id).dbdirect_effective_ips).to be_nil
        end
      end
    end

    it 'deletes ips with login authentication' do
      params = {
      }
      with_feature_flag @user1, 'dbdirect', true do
        login_as(@user1, scope: @user1.username)
        delete_json api_v1_dbdirect_ips_destroy_url(params) do |response|
          expect(response.status).to eq(204)
          expect(Carto::User.find_by_id(@user1.id).dbdirect_effective_ips).to be_nil
        end
      end
    end
  end

  describe '#show' do
    before(:each) do
      @ips = ['100.20.30.40']
      Carto::User.find_by_id(@user1.id).dbdirect_effective_ips = @ips
    end

    after(:each) do
      Carto::DbdirectCertificate.delete_all
    end

    it 'needs authentication for showing ips' do
      params = {
      }
      get_json api_v1_dbdirect_ips_show_url(params) do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'needs the feature flag for showing ips' do
      params = {
        api_key: @user1.api_key
      }
      with_feature_flag @user1, 'dbdirect', false do
        get_json api_v1_dbdirect_ips_show_url(params) do |response|
          expect(response.status).to eq(403)
        end
      end
    end

    it 'shows ips with api key authentication' do
      params = {
        api_key: @user1.api_key
      }
      with_feature_flag @user1, 'dbdirect', true do
        get_json api_v1_dbdirect_ips_show_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:ips]).to eq @ips
        end
      end
    end

    it 'shows ips with login authentication' do
      params = {
      }
      with_feature_flag @user1, 'dbdirect', true do
        login_as(@user1, scope: @user1.username)
        get_json api_v1_dbdirect_ips_show_url(params) do |response|
          expect(response.status).to eq(200)
          expect(response.body[:ips]).to eq @ips
        end
      end
    end
  end
end
