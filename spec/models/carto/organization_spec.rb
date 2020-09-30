require_relative '../../spec_helper'
require_relative '../organization_shared_examples'
require 'helpers/storage_helper'

describe Carto::Organization do
  include StorageHelper

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

  describe '#destroy' do
    before(:each) do
      @organization = Carto::Organization.find(create(:organization).id)
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
    before(:each) do
      @overquota_org = create(:carto_organization)
      @overquota_org_user = create(:carto_user)

      @overquota_org_user.update!(organization: @overquota_org)
      @overquota_org.update!(owner: @overquota_org_user)
    end

    it "should return organizations over their geocoding quota" do
      expect(Carto::Organization.overquota).to be_empty
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(10)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns 30
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns 10
      expect(Carto::Organization.overquota.map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota.size).to eq(Carto::Organization.count)
    end

    it "should return organizations over their here isolines quota" do
      expect(Carto::Organization.overquota).to be_empty
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(10)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns 10
      Carto::Organization.any_instance.stubs(:get_here_isolines_calls).returns 30
      Carto::Organization.any_instance.stubs(:here_isolines_quota).returns 10
      expect(Carto::Organization.overquota.map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota.size).to eq(Carto::Organization.count)
    end

    it "should return organizations over their data observatory snapshot quota" do
      expect(Carto::Organization.overquota).to be_empty
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(10)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns 10
      Carto::Organization.any_instance.stubs(:get_obs_snapshot_calls).returns 30
      Carto::Organization.any_instance.stubs(:obs_snapshot_quota).returns 10
      expect(Carto::Organization.overquota.map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota.size).to eq(Carto::Organization.count)
    end

    it "should return organizations over their data observatory general quota" do
      expect(Carto::Organization.overquota).to be_empty
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(10)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns 10
      Carto::Organization.any_instance.stubs(:get_obs_snapshot_calls).returns 0
      Carto::Organization.any_instance.stubs(:obs_snapshot_quota).returns 10
      Carto::Organization.any_instance.stubs(:get_obs_general_calls).returns 30
      Carto::Organization.any_instance.stubs(:obs_general_quota).returns 10
      expect(Carto::Organization.overquota.map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota.size).to eq(Carto::Organization.count)
    end

    it "should return organizations near their geocoding quota" do
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(120)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns(81)
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns(100)
      expect(Carto::Organization.overquota).to be_empty
      expect(Carto::Organization.overquota(0.20).map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota(0.20).size).to eq(Carto::Organization.count)
      expect(Carto::Organization.overquota(0.10)).to be_empty
    end

    it "should return organizations near their here isolines quota" do
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(120)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_here_isolines_calls).returns(81)
      Carto::Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      Carto::Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_general_calls).returns(0)
      Carto::Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(81)
      Carto::Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      expect(Carto::Organization.overquota).to be_empty
      expect(Carto::Organization.overquota(0.20).map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota(0.20).size).to eq(Carto::Organization.count)
      expect(Carto::Organization.overquota(0.10)).to be_empty
    end

    it "should return organizations near their data observatory snapshot quota" do
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(120)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Carto::Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_general_calls).returns(0)
      Carto::Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(81)
      Carto::Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      Carto::Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      expect(Carto::Organization.overquota).to be_empty
      expect(Carto::Organization.overquota(0.20).map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota(0.20).size).to eq(Carto::Organization.count)
      expect(Carto::Organization.overquota(0.10)).to be_empty
    end

    it "should return organizations near their data observatory general quota" do
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(120)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Carto::Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      Carto::Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_obs_general_calls).returns(81)
      Carto::Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      Carto::Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      expect(Carto::Organization.overquota).to be_empty
      expect(Carto::Organization.overquota(0.20).map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota(0.20).size).to eq(Carto::Organization.count)
      expect(Carto::Organization.overquota(0.10)).to be_empty
    end

    it "should return organizations over their mapzen routing quota" do
      expect(Carto::Organization.overquota).to be_empty
      Carto::Organization.any_instance.stubs(:get_api_calls).returns(0)
      Carto::Organization.any_instance.stubs(:map_view_quota).returns(10)
      Carto::Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Carto::Organization.any_instance.stubs(:geocoding_quota).returns 10
      Carto::Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Carto::Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Carto::Organization.any_instance.stubs(:get_mapzen_routing_calls).returns 30
      Carto::Organization.any_instance.stubs(:mapzen_routing_quota).returns 10
      expect(Carto::Organization.overquota.map(&:id)).to include(@overquota_org.id)
      expect(Carto::Organization.overquota.size).to eq(Carto::Organization.count)
    end
  end
end
