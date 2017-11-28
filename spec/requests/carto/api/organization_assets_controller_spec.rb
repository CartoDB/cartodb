# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'
require 'helpers/storage_helper'

describe Carto::Api::OrganizationAssetsController do
  include HelperMethods, StorageHelper
  include_context 'organization with users helper'

  before(:all) do
    @owner = @carto_organization.owner
    @sub = @carto_org_user_1
    @intruder = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @intruder.destroy
    @owner = nil
    @sub = nil
  end

  let(:storage_info) do
    {
      type: 'local',
      location: 'manolo_folder',
      identifier: 'could_be_a_manolo_hash_23as4g5sh6sd7hd8j9jfgk'
    }
  end

  def asset_should_be_correct(asset_response)
    indifferent_response = asset_response.with_indifferent_access
    asset = Carto::Asset.find(indifferent_response['id'])

    asset.public_url.should eq indifferent_response['public_url']
  end

  describe('#index') do
    before(:all) do
      5.times do
        FactoryGirl.create(:organization_asset,
                           organization_id: @carto_organization.id)
      end
    end

    after(:all) do
      bypass_storage
      Carto::Asset.all.map(&:destroy)
    end

    def index_url(user: @owner, organization: @carto_organization)
      assets_url(user_domain: user.username,
                 organization_id: organization.id,
                 api_key: user.api_key)
    end

    it 'works for organization owners' do
      get_json index_url, {} do |response|
        response.status.should eq 200
        response.body.should_not be_empty
        response.body.each do |response_asset|
          asset_should_be_correct(response_asset)
        end
      end
    end

    it 'works for organization users' do
      get_json index_url(user: @sub), {} do |response|
        response.status.should eq 200
        response.body.should_not be_empty
        response.body.each do |response_asset|
          asset_should_be_correct(response_asset)
        end
      end
    end

    it 'fails for intruders' do
      get_json index_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end

    it 'fails for unauthenticated' do
      unauthenticated_url = assets_url(organization_id: @carto_organization.id,
                                       user_domain: @owner.username)
      get_json unauthenticated_url, {} do |response|
        response.status.should eq 401
      end
    end
  end

  describe('#show') do
    before(:all) do
      @asset = FactoryGirl.create(:organization_asset,
                                  organization_id: @carto_organization.id)
    end

    after(:all) do
      bypass_storage
      @asset.destroy
    end

    def show_url(user: @owner, organization: @carto_organization, asset: @asset)
      asset_url(user_domain: user.username,
                organization_id: organization.id,
                id: asset.id,
                api_key: user.api_key)
    end

    it 'works for organization owners' do
      get_json show_url, {} do |response|
        response.status.should eq 200
        response.body.should_not be_empty
        asset_should_be_correct(response.body)
      end
    end

    it 'works for organization users' do
      get_json show_url(user: @sub), {} do |response|
        response.status.should eq 200
        response.body.should_not be_empty
        asset_should_be_correct(response.body)
      end
    end

    it 'fails for intruders' do
      get_json show_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end

    it 'fails for unauthenticated' do
      unauthenticated_url = asset_url(organization_id: @carto_organization.id,
                                      id: @asset.id,
                                      user_domain: @owner.username)
      get_json unauthenticated_url, {} do |response|
        response.status.should eq 401
      end
    end

    it 'fails for inexistent assets' do
      unauthenticated_url = asset_url(user_domain: @owner.username,
                                      organization_id: @carto_organization.id,
                                      id: random_uuid,
                                      api_key: @owner.api_key)

      delete_json unauthenticated_url, {} do |response|
        response.status.should eq 404
      end
    end
  end

  describe('#destroy') do
    before(:each) do
      bypass_storage

      @asset = FactoryGirl.create(:organization_asset,
                                  organization_id: @carto_organization.id)
    end

    after(:each) do
      bypass_storage
      @asset.destroy
    end

    def destroy_url(user: @owner, organization: @carto_organization, asset: @asset)
      asset_url(user_domain: user.username,
                organization_id: organization.id,
                id: asset.id,
                api_key: user.api_key)
    end

    it 'works for organization owners' do
      delete_json destroy_url, {} do |response|
        response.status.should eq 204
        response.body.should be_empty
      end
    end

    it 'fails for organization users' do
      delete_json destroy_url(user: @sub), {} do |response|
        response.status.should eq 403
      end
    end

    it 'fails for intruders' do
      delete_json destroy_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end

    it 'fails for unauthenticated' do
      unauthenticated_url = asset_url(organization_id: @carto_organization.id,
                                      id: @asset.id,
                                      user_domain: @owner.username)
      delete_json unauthenticated_url, {} do |response|
        response.status.should eq 401
      end
    end

    it 'fails for inexistent assets' do
      unauthenticated_url = asset_url(user_domain: @owner.username,
                                      organization_id: @carto_organization.id,
                                      id: random_uuid,
                                      api_key: @owner.api_key)

      delete_json unauthenticated_url, {} do |response|
        response.status.should eq 404
      end
    end
  end

  describe('#create') do
    def create_url(user: @owner, organization: @carto_organization)
      assets_url(user_domain: user.username,
                 organization_id: organization.id,
                 api_key: user.api_key)
    end

    let(:payload) do
      {
        resource: 'https://manolo.es/es/co/bar.png'
      }
    end

    before(:each) { bypass_storage }

    after(:all) do
      bypass_storage
      Carto::Asset.all.map(&:destroy)
    end

    it 'works for organization owners' do
      Carto::OrganizationAssetsService.instance
                                      .stubs(:fetch_file)
                                      .returns(Tempfile.new('test'))

      post_json create_url, payload do |response|
        response.status.should eq 201
        asset_should_be_correct(response.body)
      end
    end

    it 'fails for organization users' do
      post_json create_url(user: @sub), payload do |response|
        response.status.should eq 403
      end
    end

    it 'fails for intruders' do
      post_json create_url(user: @intruder), payload do |response|
        response.status.should eq 403
      end
    end

    it 'fails for unauthenticated' do
      unauthenticated_url = assets_url(organization_id: @carto_organization.id,
                                       user_domain: @owner.username)
      post_json unauthenticated_url, payload do |response|
        response.status.should eq 401
      end
    end

    it 'fails if resource unspecified' do
      post_json create_url, {} do |response|
        response.status.should eq 422
        response.body[:errors].should eq 'Missing resource for asset'
      end
    end
  end
end
