# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::OrganizationAssetsController do
  include HelperMethods
  include_context 'organization with users helper'

  before(:each) { bypass_storage }

  before(:all) do
    @owner = @carto_organization.owner
    @intruder = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @intruder.destroy
    @owner = nil
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

    def index_url(subdomain: @owner.username,
                  organization_id: @carto_organization.id,
                  api_key: @owner.api_key)
      assets_url(user_domain: subdomain,
                 organization_id: organization_id,
                 api_key: api_key)
    end

    it 'works for organization users' do
      get_json index_url, {} do |response|
        response.status.should eq 200
      end
    end
  end
end
