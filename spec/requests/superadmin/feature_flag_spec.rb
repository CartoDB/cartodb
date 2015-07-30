# encoding: utf-8
require_relative '../../acceptance_helper'

describe FeatureFlag do
  before(:each) do
    @headers = {'CONTENT_TYPE'  => 'application/json'}
  end

  describe '#create' do
    it 'should create feature flag' do
      feature_flag = FactoryGirl.build(:feature_flag)

      expect {
        post superadmin_feature_flags_url, { feature_flag: feature_flag }.to_json, @headers
        response.status.should == 204
      }.to change(FeatureFlag, :count).by(1)
    end
  end

  describe '#update' do
    it 'should update feature flag name' do
      feature_flag      = FactoryGirl.build(:feature_flag)
      test_feature_flag = FactoryGirl.build(:feature_flag)

      test_feature_flag.id   = feature_flag.id
      test_feature_flag.name = "test_new_name"

      old_name = feature_flag.name

      expect {
        put superadmin_feature_flag_url(feature_flag.id), { feature_flag: test_feature_flag }.to_json, @headers

        feature_flag.reload
      }.to change(feature_flag, :name).from(old_name).to(test_feature_flag.name)
    end
  end

  describe '#destroy' do

    it 'should destroy feature flag' do
      feature_flag = FactoryGirl.create(:feature_flag)

      expect {
        delete superadmin_feature_flag_url(feature_flag.id), { feature_flag: feature_flag }.to_json, @headers
      }.to change(FeatureFlag, :count).by(-1)
    end

    it 'should destroy feature flag user relations' do
      feature_flag = FactoryGirl.create(:feature_flag)
      user         = FactoryGirl.create(:user)

      feature_flag_user = FactoryGirl.create(:feature_flags_user, feature_flag_id: feature_flag.id, user_id: user.id)

      expect {
        delete superadmin_feature_flag_url(feature_flag.id), { feature_flag: feature_flag }.to_json, @headers
      }.to change(FeatureFlagsUser, :count).by(-1)
    end
  end
end