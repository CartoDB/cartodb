# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::FeatureFlag do

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @user_ff = FactoryGirl.create(:carto_feature_flag, name: 'user-ff', restricted: true)
    @unused_ff = FactoryGirl.create(:carto_feature_flag, name: 'unused-ff', restricted: true)
    FactoryGirl.create(:feature_flags_user, feature_flag_id: @user_ff.id, user_id: @user.id)
    @unrestricted_ff = FactoryGirl.create(:carto_feature_flag, name: 'unrestricted-ff', restricted: false)
  end

  after(:all) do
    @user.destroy
    [@user_ff, @unused_ff, @unrestricted_ff].each(&:destroy)
  end

  describe "#find_by_user" do
    it "returns the user feature flags and the unrestricted ones" do
      expected_result = [@unrestricted_ff, @user_ff]

      result = Carto::FeatureFlag.find_by_user(@user)

      expect(result).to eql(expected_result)
    end
  end

end
