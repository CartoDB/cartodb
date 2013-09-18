#encoding: UTF-8

require 'spec_helper'

describe Geocoding do
  before(:all) do
    @user = create_user(geocoding_quota: 200)
  end

  describe '#setup' do
    let(:geocoding) { FactoryGirl.create(:geocoding, user: @user) }

    it 'sets default timestamps value' do
      geocoding.created_at.should_not be_nil
      geocoding.updated_at.should_not be_nil
    end

    it 'links user and geocoding' do
      geocoding.user.should eq @user
    end
  end

  describe '#save' do
    it 'updates updated_at' do
      geocoding = FactoryGirl.build(:geocoding, user: @user)
      expect { geocoding.save }.to change(geocoding, :updated_at)
    end
  end
end
