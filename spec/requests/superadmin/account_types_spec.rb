# encoding: utf-8

require_relative '../../acceptance_helper'

describe Superadmin::AccountTypesController do
  describe '#create' do
    before(:each) do
      Carto::AccountType.where(account_type: "PRO").each(&:destroy)
      @account_type = FactoryGirl.build(:account_type_pro)
      @account_type_param = {
        account_type: @account_type.account_type,
        rate_limit: @account_type.rate_limit.api_attributes
      }
    end

    after(:each) do
      @account_type.destroy
    end

    it 'should create account_type' do
      expect {
        post superadmin_account_types_url, { account_type: @account_type_param }.to_json, superadmin_headers

        response.status.should == 204
      }.to change(Carto::AccountType, :count).by(1)
    end
  end

  describe '#update' do
    before(:each) do
      Carto::AccountType.where(account_type: "PRO").each(&:destroy)
      @account_type = FactoryGirl.build(:account_type_pro)
      @rate_limits = FactoryGirl.build(:rate_limits_custom)
      @account_type_param = {
        account_type: @account_type.account_type,
        rate_limit: @rate_limits.api_attributes
      }
    end

    after(:each) do
      @rate_limits.destroy
      @account_type.destroy
    end

    it 'should update an account type' do
      @account_type.save!

      expect {
        put superadmin_account_type_url(@account_type.account_type),
            { account_type: @account_type_param }.to_json,
            superadmin_headers

        @account_type.reload
        @account_type.rate_limit.api_attributes.should eq @rate_limits.api_attributes
      }.to change(Carto::RateLimit, :count).by(0)
    end

    it 'should not update an account type with empty rate limits' do
      @account_type.save!
      rate_limit_id = @account_type.rate_limit_id

      put superadmin_account_type_url(@account_type.account_type),
          { account_type: { account_type: @account_type.account_type } }.to_json,
          superadmin_headers do |response|

        response.status.should == 500
        @account_type.rate_limit_id.should eq rate_limit_id
      end
    end
  end

  describe '#destroy' do
    before(:each) do
      Carto::AccountType.where(account_type: "PRO").each(&:destroy)
      @account_type = FactoryGirl.build(:account_type_pro)
    end

    after(:each) do
      @account_type.destroy
    end

    it 'should destroy account type' do
      @account_type.save!

      expect {
        delete superadmin_account_type_url(@account_type.account_type), nil, superadmin_headers
      }.to change(Carto::AccountType, :count).by(-1)
    end
  end
end
