require_relative '../spec_helper'

describe AccountTokensController do

  describe 'token validation' do

    it 'returns 404 for nonexisting tokens' do
      get enable_account_token_show_url(id: UUIDTools::UUID.timestamp_create.to_s)
      response.status.should == 404
    end

    describe 'account validation' do

      before(:each) do
        User.any_instance.stubs(:enable_remote_db_user).returns(true)
        @user = FactoryGirl.create(:valid_user)
      end

      after(:each) do
        @user.destroy
      end

      it 'cleans existing tokens from users' do
        @user.enable_account_token = 'thisisatoken'
        @user.save
        @user.enable_account_token.should_not be_nil

        get enable_account_token_show_url(id: @user.enable_account_token)
        response.status.should == 200
        @user.reload
        @user.enable_account_token.should == nil
      end

    end

  end

end
