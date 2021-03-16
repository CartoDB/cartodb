require_relative '../spec_helper'

describe AccountTokensController do

  describe 'token validation' do

    it 'returns 404 for nonexisting tokens' do
      get enable_account_token_show_url(id: Carto::UUIDHelper.random_uuid)
      response.status.should == 404
    end

    describe 'account validation' do

      before(:each) do
        CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
        @user = create(:valid_user)
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

    describe 'resend validation mail' do

      it 'returns 404 for nonexisting users' do
        get resend_validation_mail_url(user_id: Carto::UUIDHelper.random_uuid)
        response.status.should == 404
      end

      describe 'valid user behaviour' do

        before(:each) do
          CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
          @user = create(:valid_user)
        end

        after(:each) do
          @user.destroy
        end

        it 'triggers a NewOrganizationUser job with user_id' do
          ::Resque.expects(:enqueue).with(::Resque::UserJobs::Mail::NewOrganizationUser, @user.id).returns(true)
          get resend_validation_mail_url(user_id: @user.id)
          response.status.should == 200
        end

      end

    end

  end

end
