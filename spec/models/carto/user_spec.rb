# coding: UTF-8
require_relative '../../spec_helper'
require_relative '../user_shared_examples'

describe Carto::User do
  it_behaves_like 'user models' do
    def get_twitter_imports_count_by_user_id(user_id)
      get_user_by_id(user_id).twitter_imports_count
    end

    def get_user_by_id(user_id)
      Carto::User.where(id: user_id).first
    end

    def create_user
      FactoryGirl.create(:carto_user)
    end
  end

  describe '#needs_password_confirmation?' do
    it 'is true for a normal user' do
      user = FactoryGirl.build(:carto_user, :google_sign_in => nil)
      user.needs_password_confirmation?.should == true

      user = FactoryGirl.build(:carto_user, :google_sign_in => false)
      user.needs_password_confirmation?.should == true
    end

    it 'is false for users that signed in with Google' do
      user = FactoryGirl.build(:carto_user, :google_sign_in => true)
      user.needs_password_confirmation?.should == false
    end

    it 'is true for users that signed in with Google but changed the password' do
      user = FactoryGirl.build(:carto_user, :google_sign_in => true, :last_password_change_date => Time.now)
      user.needs_password_confirmation?.should == true
    end
  end

  describe '#remove_logo and #soft_geocoding_limit' do
    before(:all) do
      @carto_user = FactoryGirl.build(:carto_user)
    end

    it 'false for free accounts' do
      @carto_user.account_type = Carto::AccountType::FREE

      @carto_user.remove_logo?.should be_false
      @carto_user.soft_geocoding_limit?.should be_false
    end

    it 'true for BASIC and PRO accounts' do
      [Carto::AccountType::BASIC, Carto::AccountType::PRO].each do |account_type|
        @carto_user.account_type = account_type

        @carto_user.remove_logo?.should be_true
        @carto_user.soft_geocoding_limit?.should be_true
      end
    end

    it 'true for Mercator academic accounts' do
      @carto_user.account_type = 'Mercator LUMP-SUM Academic'

      @carto_user.remove_logo?.should be_true
    end

    it 'false for other accounts' do
      ['ACADEMY-350', 'JOHN SNOW', 'MAGELLAN'].each do |account_type|
        @carto_user.account_type = account_type

        @carto_user.remove_logo?.should be_false
      end
    end
  end
end
