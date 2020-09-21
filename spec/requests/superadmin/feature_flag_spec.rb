require_relative '../../acceptance_helper'

describe Carto::FeatureFlag do
  let(:feature_flag) { create(:feature_flag) }

  describe '#create' do
    let(:feature_flag) { build(:feature_flag) }

    context 'when everything is OK' do
      it 'should create feature flag' do
        payload = { feature_flag: feature_flag.attributes }.to_json
        expect {
          post superadmin_feature_flags_url, payload, superadmin_headers
        }.to change(Carto::FeatureFlag, :count).by(1)

        expect(response.status).to eq(204)
      end
    end

    context 'when an error occurs' do
      it 'returns an error' do
        post superadmin_feature_flags_url, {}.to_json, superadmin_headers

        expect(response.status).to eq(500)
      end
    end
  end

  describe '#update' do
    it 'should update feature flag name' do
      payload = { feature_flag: feature_flag.attributes.merge('name' => 'new_name') }.to_json
      put superadmin_feature_flag_url(feature_flag.id), payload, superadmin_headers

      expect(feature_flag.reload.name).to eq('new_name')
    end
  end

  describe '#destroy' do
    let(:payload) { {}.to_json }
    let(:user) { create(:user) }

    before { feature_flag.save! }

    it 'should destroy feature flag' do
      expect {
        delete superadmin_feature_flag_url(feature_flag.id), payload, superadmin_headers
      }.to change(Carto::FeatureFlag, :count).by(-1)
    end

    it 'should destroy feature flag user relations' do
      user.activate_feature_flag!(feature_flag)

      expect {
        delete superadmin_feature_flag_url(feature_flag.id), payload, superadmin_headers
      }.to change(Carto::FeatureFlagsUser, :count).by(-1)
    end
  end

end
