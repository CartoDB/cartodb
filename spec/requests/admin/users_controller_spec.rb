# encoding: utf-8

require_relative '../../spec_helper_min'
require_relative '../../support/factories/users'

describe Admin::OrganizationUsersController do
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
    host! "#{@user.username}.localhost.lan"
    login_as(@user, scope: @user.username)
  end

  describe '#update' do
    describe '#account' do
      it 'updates password' do
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

      it 'does not update if communication with Central fails' do
        params = {
          email: 'fail-' + @user.email
        }

        put account_update_user_url, user: params

        last_response.status.should eq 200
        last_response.body.should   include('There was a problem while updating your data')
        @user.reload
        @user.email.should_not start_with('fail-')
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
          available_for_hire: true
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
        params = {
          name: 'fail-' + @user.name
        }

        put profile_update_user_url, user: params

        last_response.status.should eq 200
        last_response.body.should   include('There was a problem while updating your data')
        @user.reload
        @user.name.should_not start_with('fail-')
      end
    end
  end
end
