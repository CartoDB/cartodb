# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../organization_shared_examples'

describe Carto::Organization do

  it_behaves_like 'organization models' do

    before(:each) do
      # INFO: forcing ActiveRecord initialization so expectations on number of queries don't count AR queries
      @the_organization = Carto::Organization.where(id: @organization.id).first
      @the_organization.owner
      Carto::SearchTweet.count
      Carto::Geocoding.count
    end

    def get_twitter_imports_count_by_organization_id(organization_id)
      raise "id doesn't match" unless organization_id == @the_organization.id
      @the_organization.twitter_imports_count
    end

    def get_geocoding_calls_by_organization_id(organization_id)
      raise "id doesn't match" unless organization_id == @the_organization.id
      @the_organization.get_geocoding_calls
    end

    def get_organization
      @the_organization
    end

  end

  describe 'deletion' do
    it 'destroys its groups through the extension' do
      Carto::Group.any_instance.expects(:destroy_group_with_extension).once
      organization = Carto::Organization.find(FactoryGirl.create(:organization).id)
      FactoryGirl.create(:carto_group, organization: organization)
      organization.destroy
    end
  end
end
