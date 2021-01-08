require_relative '../../spec_helper'
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
      expect_any_instance_of(Carto::Group).to receive(:destroy_group_with_extension).once
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
    let(:api_calls) { 0 }
    let(:geocoding_calls) { 0 }
    let(:obs_snapshot_calls) { 0 }
    let(:here_isolines_calls) { 0 }
    let(:obs_general_calls) { 0 }
    let(:mapzen_routing_calls) { 0 }

    before do
      allow(organization).to receive(:get_api_calls).and_return(api_calls)
      allow(organization).to receive(:map_view_quota).and_return(100)
      allow(organization).to receive(:get_geocoding_calls).and_return(geocoding_calls)
      allow(organization).to receive(:geocoding_quota).and_return(100)
      allow(organization).to receive(:get_obs_snapshot_calls).and_return(obs_snapshot_calls)
      allow(organization).to receive(:obs_snapshot_quota).and_return(100)
      allow(organization).to receive(:obs_general_quota).and_return(100)
      allow(organization).to receive(:get_obs_general_calls).and_return(obs_general_calls)
      allow(organization).to receive(:mapzen_routing_quota).and_return(100)
      allow(organization).to receive(:get_mapzen_routing_calls).and_return(mapzen_routing_calls)
      allow(organization).to receive(:here_isolines_quota).and_return(100)
      allow(organization).to receive(:get_here_isolines_calls).and_return(here_isolines_calls)
    end

    context 'when over geocoding quota' do
      let(:geocoding_calls) { 101 }

      it { should be_true }
    end

    context 'when over here isolines quota' do
      let(:here_isolines_calls) { 101 }

      it { should be_true }
    end

    context 'when over data observatory snapshot quota' do
      let(:obs_snapshot_calls) { 101 }

      it { should be_true }
    end

    context 'when over their data observatory general quota' do
      let(:obs_general_calls) { 101 }

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

      context 'with data observatory snapshot quota quota near limit' do
        let(:obs_snapshot_calls) { 81 }

        it { should be_true }
      end

      context 'with data observatory general quota quota near limit' do
        let(:obs_general_calls) { 81 }

        it { should be_true }
      end
    end
  end
end
