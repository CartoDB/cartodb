# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/public/custom_visualizations_controller'
require_relative '../../../../lib/carto/configuration'

describe Carto::Api::Public::CustomVisualizationsController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
  end

  before(:each) do
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
    FileUtils.rmtree(Carto::Conf.new.public_uploads_path() + '/tests')
  end

  describe '#common' do
    it 'works with master api_key' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
      end
    end

    it 'works with oauth api_key' do
      api_key = FactoryGirl.create(:oauth_api_key, user_id: @user.id)

      get_json api_v4_kuviz_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(200)
      end
    end

    it 'works with regular api_key' do
      api_key = FactoryGirl.create(:api_key_apis, user_id: @user.id)
      get_json api_v4_kuviz_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(200)
      end
    end

    it 'return 401 without api_key' do
      get_json api_v4_kuviz_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'return 401 with cookie auth' do
      login_as(@user, scope: @user.username)
      get_json api_v4_kuviz_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end
  end

  describe '#index' do
    before(:each) do
      @kuviz = FactoryGirl.create(:kuviz_visualization, user: @user)
      @kuviz.save
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      @kuviz_password = FactoryGirl.create(:kuviz_protected_visualization, user: @user)
      @kuviz_password.save
      @asset_password = Carto::Asset.for_visualization(visualization: @kuviz_password,
                                                       resource: StringIO.new('<html><body>test</body></html>'))
      @asset_password.save
    end

    after(:each) do
      @kuviz.destroy
      @kuviz_password.destroy
    end

    it 'shows one visualization' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(2)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should return one visualization but total should be two' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1 do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should order results by legal order fields: name, updated_at and privacy' do
      @kuviz.name = '1'
      @kuviz.updated_at = Time.parse('2019-01-01 00:00:00.000')
      @kuviz.save
      @kuviz_password.name = '2'
      @kuviz_password.updated_at = Time.parse('2019-12-31 23:59:59.999')
      @kuviz_password.save

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:name]).to eq('2')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:name]).to eq('1')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'updated_at' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:updated_at]).to eq('2019-12-31T23:59:59.999Z')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:updated_at]).to eq('2019-01-01T00:00:00.000Z')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:privacy]).to eq('public')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:privacy]).to eq('password')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'non_valid' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error].scan(/Wrong 'order' parameter value/).present?).to be true
      end
    end

    it 'should return only password visualizations' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), privacy: 'password' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total_entries]).to eq(1)
        expect(response.body[:visualizations][0][:privacy]).to eq('password')
      end
    end
  end

  describe '#create' do
    it 'rejects if name parameter is not send in the request' do
      string_base64 = Base64.encode64('test string non-html')
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64, name: nil do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64 do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
    end

    it 'rejects if data parameter is not send in the request' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: nil, name: 'test' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), name: 'test' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
    end

    it 'rejects if data parameter is not encoded in base64' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: 'non-base64 test', name: 'test' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be encoded in base64')
      end
    end

    it 'rejects non html content' do
      string_base64 = Base64.strict_encode64('test string non-html')
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64, name: 'test' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
      pixel_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: pixel_base64, name: 'test' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
    end

    it 'stores html content' do
      html_base64 = Base64.strict_encode64('<html><head><title>test</title></head><body>test</body></html>')
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: html_base64, name: 'test' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations]).present?.should be true
        expect(response.body[:url]).present?.should be true
      end
    end
  end
end
