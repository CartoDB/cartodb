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

end
