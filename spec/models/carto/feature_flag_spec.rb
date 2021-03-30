require 'spec_helper_unit'

describe Carto::FeatureFlag do

  let(:restricted_feature_flag) { create(:feature_flag, :restricted) }
  let(:not_restricted_feature_flag) { create(:feature_flag, :not_restricted) }

  describe '::restricted' do
    subject { Carto::FeatureFlag.restricted }

    it 'returns restricted feature flags' do
      expect(subject).to include(restricted_feature_flag)
    end

    it 'does not return unrestricted feature flags' do
      expect(subject).not_to include(not_restricted_feature_flag)
    end
  end

  describe '::not_restricted' do
    subject { Carto::FeatureFlag.not_restricted }

    it 'does not return restricted feature flags' do
      expect(subject).not_to include(restricted_feature_flag)
    end

    it 'returns unrestricted feature flags' do
      expect(subject).to include(not_restricted_feature_flag)
    end
  end
end
