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

    end

    after(:all) do
    end
  end
end
