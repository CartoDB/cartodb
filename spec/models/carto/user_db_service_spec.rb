# coding: UTF-8
require_relative '../../spec_helper_min'

describe Carto::UserDBService do
  include_context 'organization with users helper'

  before(:all) do
    @user = Carto::User.find(FactoryGirl.create(:valid_user).id)
  end

  after(:all) do
    @user.destroy
  end

  describe '#public_user_roles' do
    it 'should return public user for non-org users' do
      expect(Carto::UserDBService.new(@user).public_user_roles).to eq [CartoDB::PUBLIC_DB_USER]
    end

    it 'should return public user and org public user for org users' do
      expect(Carto::UserDBService.new(@carto_org_user_1).public_user_roles).to eq [
        CartoDB::PUBLIC_DB_USER,
        "cartodb_publicuser_#{@carto_org_user_1.id}"
      ]
    end
  end
end
