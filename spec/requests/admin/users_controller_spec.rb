# encoding: utf-8

require_relative '../../spec_helper_min'
require_relative '../../support/factories/users'

describe Admin::UsersController do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include CartoDB::Factories

  before(:all) do
    @user = create_user(password: 'abcdefgh')
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    Admin::UsersController.any_instance.stubs(:render)
    # Reload user, cannot use reload because it does not reload password fields
    @user = ::User[@user.id]
    host! "#{@user.username}.localhost.lan"
    login_as(@user, scope: @user.username)
  end

  describe '#delete' do
    let(:password) { 'abcdefgh' }
    before(:all) do
      @user2 = create_user(password: password)
      @saml_organization = FactoryGirl.create(:saml_organization)
      @saml_user = create_user(password: password, organization_id: @saml_organization.id)
      @saml_user.reload
    end

    after(:all) do
      @saml_organization.destroy_cascade
    end

    it 'requires password' do
      host! "#{@user2.username}.localhost.lan"
      login_as(@user2, scope: @user2.username)
      delete account_user_url
      Carto::User.where(id: @user2.id).first.should_not be_nil
      last_response.status.should eq 200
      Carto::User.where(id: @user2.id).first.should be
    end

    it 'does not require password for SAML organizations' do
      host! "#{@saml_organization.name}.localhost.lan"
      login_as(@saml_user, scope: @saml_organization.name)
      delete account_user_url(scope: @saml_organization.name)
      Carto::User.where(id: @saml_user.id).first.should be_nil
    end

    it 'deletes if password match' do
      host! "#{@user2.username}.localhost.lan"
      login_as(@user2, scope: @user2.username)
      delete account_user_url(deletion_password_confirmation: password)
      Carto::User.where(id: @user2.id).first.should be_nil
    end
  end

  describe '#update' do
    describe '#account' do
      it 'fails to update password if it does not change' do
        last_change = @user.last_password_change_date
        params = {
          old_password:     'abcdefgh',
          new_password:     'abcdefgh',
          confirm_password: 'abcdefgh'
        }

        ::User.any_instance.stubs(:update_in_central).returns(true)
        put account_update_user_url, user: params

        last_response.status.should eq 200
        @user.reload
        @user.validate_old_password('abcdefgh').should be_true
        @user.validate_old_password('zyxwvuts').should be_false
        @user.last_password_change_date.should eq last_change
      end

      it 'updates email' do
        params = {
          email: @user.email + '.ok'
        }

        ::User.any_instance.stubs(:update_in_central).returns(true)
        put account_update_user_url, user: params

        last_response.status.should eq 302
        @user.reload
        @user.email.should end_with('.ok')
      end

      it 'does not update account if communication with Central fails' do
        ::User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure.new('Failed'))
        params = {
          email: 'fail-' + @user.email
        }

        put account_update_user_url, user: params

        last_response.status.should eq 200

        @user.reload
        @user.email.should_not start_with('fail-')
      end

      it 'validates before updating in Central' do
        ::User.any_instance.stubs(:update_in_central).never
        params = {
          old_password:     'abcdefgh',
          new_password:     'zyx',
          confirm_password: 'abc'
        }

        put account_update_user_url, user: params

        last_response.status.should eq 200
      end
    end

    describe '#profile' do
      it 'updates profile' do
        params = {
          name:               'Mengano',
          website:            'http://somesite.com',
          description:        'I describe myself',
          location:           'Nowhere',
          twitter_username:   'asd',
          disqus_shortname:   'qwe',
          available_for_hire: true,
          password_confirmation: 'abcdefgh'
        }
        ::User.any_instance.stubs(:update_in_central).returns(true)
        put profile_update_user_url, user: params

        last_response.status.should eq 302
        @user.reload
        @user.name.should               eq params[:name]
        @user.website.should            eq params[:website]
        @user.description.should        eq params[:description]
        @user.location.should           eq params[:location]
        @user.twitter_username.should   eq params[:twitter_username]
        @user.disqus_shortname.should   eq params[:disqus_shortname]
        @user.available_for_hire.should eq params[:available_for_hire]
      end

      it 'does not update profile if communication with Central fails' do
        ::User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure.new('Failed'))
        params = {
          name: 'fail-' + @user.name
        }

        put profile_update_user_url, user: params

        last_response.status.should eq 200
        @user.reload
        @user.name.should_not start_with('fail-')
      end

      it 'updates password' do
        last_change = @user.last_password_change_date
        params = {
          old_password:     'abcdefgh',
          new_password:     'zyxwvuts',
          confirm_password: 'zyxwvuts'
        }

        ::User.any_instance.stubs(:update_in_central).returns(true)
        put account_update_user_url, user: params

        last_response.status.should eq 302
        @user.reload
        @user.validate_old_password('abcdefgh').should be_false
        @user.validate_old_password('zyxwvuts').should be_true
        @user.last_password_change_date.should_not eq last_change
      end
    end
  end
end
