# encoding: utf-8

require_relative '../../acceptance_helper'

describe Superadmin::PricePlansController do
  describe '#create' do
    before(:each) do
      @account_type = FactoryGirl.build(:account_type_pro)
      @price_plan_param = {
        account_type: @account_type.account_type,
        rate_limit: @account_type.rate_limit.api_attributes
      }
    end

    after(:each) do
      @account_type.destroy
    end

    it 'should create account_type' do
      expect {
        post superadmin_price_plans_url, { price_plan: @price_plan_param }.to_json, superadmin_headers

        response.status.should == 204
      }.to change(Carto::AccountType, :count).by(1)
    end
  end
end
