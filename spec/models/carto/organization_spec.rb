require 'spec_helper_unit'
require_relative '../organization_shared_examples'
require 'helpers/storage_helper'

describe Carto::Organization do
  include StorageHelper

  it_behaves_like 'organization models' do
    before(:each) do
      # INFO: forcing ActiveRecord initialization so expectations on number of queries don't count AR queries
      @the_organization = described_class.where(id: @organization.id).first
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

  describe '#destroy' do
    before(:each) do
      @organization = described_class.find(create(:organization).id)
    end

    it 'destroys its groups through the extension' do
      Carto::Group.any_instance.expects(:destroy_group_with_extension).once
      create(:carto_group, organization: @organization)
      @organization.destroy
    end

    it 'destroys organization assets' do
      bypass_storage
      asset = create(:organization_asset,
                                 organization_id: @organization.id)

      @organization.destroy
      expect(Carto::Asset.exists?(asset.id)).to be_false
    end
  end

  describe '#overquota?' do
    subject { organization.overquota?(delta) }

    let(:organization) { create(:organization_with_users) }
    let(:delta) { 0 }
    let(:geocoding_calls) { 0 }
    let(:here_isolines_calls) { 0 }
    let(:mapzen_routing_calls) { 0 }

    before do
      organization.stubs(:map_views_quota).returns(100)
      organization.stubs(:get_geocoding_calls).returns(geocoding_calls)
      organization.stubs(:geocoding_quota).returns(100)
      organization.stubs(:mapzen_routing_quota).returns(100)
      organization.stubs(:get_mapzen_routing_calls).returns(mapzen_routing_calls)
      organization.stubs(:here_isolines_quota).returns(100)
      organization.stubs(:get_here_isolines_calls).returns(here_isolines_calls)
    end

    context 'when over geocoding quota' do
      let(:geocoding_calls) { 101 }

      it { should be_true }
    end

    context 'when over here isolines quota' do
      let(:here_isolines_calls) { 101 }

      it { should be_true }
    end

    context 'when over their mapzen routing quota' do
      let(:mapzen_routing_calls) { 101 }

      it { should be_true }
    end

    context 'when searching for organizations near quota' do
      let(:delta) { 0.20 }

      context 'with geocoding quota near limit' do
        let(:geocoding_calls) { 81 }

        it { should be_true }
      end

      context 'with here isolines quota quota near limit' do
        let(:here_isolines_calls) { 81 }

        it { should be_true }
      end
    end
  end
end
