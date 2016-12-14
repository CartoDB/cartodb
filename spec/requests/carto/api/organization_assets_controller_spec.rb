# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::OrganizationAssetsController do
  include HelperMethods
  include_context 'organization with users helper'

  before(:each) { bypass_storage }

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

  def asset_should_be_correct(asset_response)
    asset = Carto::Asset.find(asset_response['id'])

    asset.public_url.should eq asset_response['public_url']
  end

  describe('#index') do
    before(:all) do
      5.times do
        Carto::Asset.create!(organization_id: @carto_organization.id,
                             public_url: 'manolo')
      end
    end

    after(:all) do
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
end
