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

  describe '.overquota' do
    let!(:organization) { create(:carto_organization) }
    let(:overquota_organization) { create(:carto_organization) }
    let(:user) { create(:carto_user) }

    before do
      overquota_organization.update!(owner: user)
      user.update!(organization: overquota_organization)
    end

    it 'should return organizations over their geocoding quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(10)
      described_class.any_instance.stubs(:get_geocoding_calls).returns 30
      described_class.any_instance.stubs(:geocoding_quota).returns 10

      expect(described_class.overquota).not_to include(organization)
      expect(described_class.overquota).to include(overquota_organization)
    end

    it 'should return organizations over their here isolines quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(10)
      described_class.any_instance.stubs(:get_geocoding_calls).returns 0
      described_class.any_instance.stubs(:geocoding_quota).returns 10
      described_class.any_instance.stubs(:get_here_isolines_calls).returns 30
      described_class.any_instance.stubs(:here_isolines_quota).returns 10

      expect(described_class.overquota).not_to include(organization)
      expect(described_class.overquota).to include(overquota_organization)
    end

    it 'should return organizations over their data observatory snapshot quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(10)
      described_class.any_instance.stubs(:get_geocoding_calls).returns 0
      described_class.any_instance.stubs(:geocoding_quota).returns 10
      described_class.any_instance.stubs(:get_obs_snapshot_calls).returns 30
      described_class.any_instance.stubs(:obs_snapshot_quota).returns 10

      expect(described_class.overquota).not_to include(organization)
      expect(described_class.overquota).to include(overquota_organization)
    end

    it 'should return organizations over their data observatory general quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(10)
      described_class.any_instance.stubs(:get_geocoding_calls).returns 0
      described_class.any_instance.stubs(:geocoding_quota).returns 10
      described_class.any_instance.stubs(:get_obs_snapshot_calls).returns 0
      described_class.any_instance.stubs(:obs_snapshot_quota).returns 10
      described_class.any_instance.stubs(:get_obs_general_calls).returns 30
      described_class.any_instance.stubs(:obs_general_quota).returns 10

      expect(described_class.overquota).not_to include(organization)
      expect(described_class.overquota).to include(overquota_organization)
    end

    it 'should return organizations near their geocoding quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(120)
      described_class.any_instance.stubs(:get_geocoding_calls).returns(81)
      described_class.any_instance.stubs(:geocoding_quota).returns(100)

      expect(described_class.overquota).to be_empty
      expect(described_class.overquota(0.20)).not_to include(organization)
      expect(described_class.overquota(0.20)).to include(overquota_organization)
      expect(described_class.overquota(0.10)).to be_empty
    end

    it 'should return organizations near their here isolines quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(120)
      described_class.any_instance.stubs(:get_geocoding_calls).returns(0)
      described_class.any_instance.stubs(:geocoding_quota).returns(100)
      described_class.any_instance.stubs(:get_here_isolines_calls).returns(81)
      described_class.any_instance.stubs(:here_isolines_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      described_class.any_instance.stubs(:obs_snapshot_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_general_calls).returns(0)
      described_class.any_instance.stubs(:obs_general_quota).returns(100)
      described_class.any_instance.stubs(:get_mapzen_routing_calls).returns(81)
      described_class.any_instance.stubs(:mapzen_routing_quota).returns(100)

      expect(described_class.overquota).to be_empty
      expect(described_class.overquota(0.20)).not_to include(organization)
      expect(described_class.overquota(0.20)).to include(overquota_organization)
      expect(described_class.overquota(0.10)).to be_empty
    end

    it 'should return organizations near their data observatory snapshot quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(120)
      described_class.any_instance.stubs(:get_geocoding_calls).returns(0)
      described_class.any_instance.stubs(:geocoding_quota).returns(100)
      described_class.any_instance.stubs(:get_here_isolines_calls).returns(0)
      described_class.any_instance.stubs(:here_isolines_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_general_calls).returns(0)
      described_class.any_instance.stubs(:obs_general_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_snapshot_calls).returns(81)
      described_class.any_instance.stubs(:obs_snapshot_quota).returns(100)
      described_class.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      described_class.any_instance.stubs(:mapzen_routing_quota).returns(100)

      expect(described_class.overquota).to be_empty
      expect(described_class.overquota(0.20)).not_to include(organization)
      expect(described_class.overquota(0.20)).to include(overquota_organization)
      expect(described_class.overquota(0.10)).to be_empty
    end

    it 'should return organizations near their data observatory general quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(120)
      described_class.any_instance.stubs(:get_geocoding_calls).returns(0)
      described_class.any_instance.stubs(:geocoding_quota).returns(100)
      described_class.any_instance.stubs(:get_here_isolines_calls).returns(0)
      described_class.any_instance.stubs(:here_isolines_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      described_class.any_instance.stubs(:obs_snapshot_quota).returns(100)
      described_class.any_instance.stubs(:get_obs_general_calls).returns(81)
      described_class.any_instance.stubs(:obs_general_quota).returns(100)
      described_class.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      described_class.any_instance.stubs(:mapzen_routing_quota).returns(100)

      expect(described_class.overquota).to be_empty
      expect(described_class.overquota(0.20)).not_to include(organization)
      expect(described_class.overquota(0.20)).to include(overquota_organization)
      expect(described_class.overquota(0.10)).to be_empty
    end

    it 'should return organizations over their mapzen routing quota' do
      described_class.any_instance.stubs(:get_api_calls).returns(0)
      described_class.any_instance.stubs(:map_view_quota).returns(10)
      described_class.any_instance.stubs(:get_geocoding_calls).returns 0
      described_class.any_instance.stubs(:geocoding_quota).returns 10
      described_class.any_instance.stubs(:get_here_isolines_calls).returns(0)
      described_class.any_instance.stubs(:here_isolines_quota).returns(100)
      described_class.any_instance.stubs(:get_mapzen_routing_calls).returns 30
      described_class.any_instance.stubs(:mapzen_routing_quota).returns 10

      expect(described_class.overquota(0.20)).not_to include(organization)
      expect(described_class.overquota(0.20)).to include(overquota_organization)
    end
  end
end
