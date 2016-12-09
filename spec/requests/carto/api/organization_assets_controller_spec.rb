# encoding: utf-8

require 'spec_helper_min'

describe Carto::Api::OrganizationAssetsController do
  include_context 'organization with users helper'

  before(:all) do
    @intruder = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @intruder.destroy
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
  end
end
