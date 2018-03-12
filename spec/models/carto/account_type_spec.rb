# encoding: utf-8

require 'spec_helper_min'
require 'support/helpers'

describe Carto::AccountType do
  include CartoDB::Factories

  before :each do
    @limits_feature_flag = FactoryGirl.create(:feature_flag, name: 'limits_v2', restricted: false)
    User.any_instance.stubs(:save_rate_limits).returns(true)
    @user = FactoryGirl.create(:valid_user)
    @account_type = FactoryGirl.create(:account_type_pro)
  end

  after :each do
    User.any_instance.unstub(:save_rate_limits)
    @user.destroy if @user
    @account_type.destroy if @user
    @limits_feature_flag.destroy
  end

  describe '#create' do
    it 'is persisted correctly to database' do
      account_type = Carto::AccountType.find(@account_type.account_type)

      account_type.should_not be_nil
      account_type.rate_limit.should_not be_nil
    end

    it 'destroys an account_type' do
      account_type = Carto::AccountType.find(@account_type.account_type)
      account_type.destroy

      expect {
        Carto::AccountType.find(@account_type.account_type)
      }.to raise_error(ActiveRecord::RecordNotFound)

      expect {
        Carto::RateLimit.find(@account_type.rate_limit_id)
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'updates the rate limits of an account_type' do
      account_type = Carto::AccountType.find(@account_type.account_type)

      rate_limits = FactoryGirl.create(:rate_limits)
      account_type.rate_limit = rate_limits
      account_type.save

      updated_account_type = Carto::AccountType.find(@account_type.account_type)
      updated_account_type.rate_limit.id.should eq rate_limits.id
    end
  end
end
