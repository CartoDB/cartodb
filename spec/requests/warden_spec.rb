require 'spec_helper_min'
require 'support/helpers'

describe 'Warden' do
  def login
    # Manual login because `login_as` skips normal warden hook processing
    host! "#{@user.username}.localhost.lan"
    post create_session_url(email: @user.email, password: @user.password)
  end

  def wrong_login
    host! "#{@user.username}.localhost.lan"
    post create_session_url(email: @user.email, password: 'bla')
  end

  describe ':auth_api Strategy' do
    include_context 'users helper'
    include HelperMethods

    def generate_api_key_url
      api_keys_url(user_domain: @user_api_keys.username)
    end

    before :all do
      @user_api_keys = FactoryGirl.create(:valid_user)
      @master_api_key = Carto::ApiKey.where(user_id: @user_api_keys.id).master.first
    end

    after :all do
      @user_api_keys.destroy
    end

    it 'authenticates with header' do
      get_json generate_api_key_url, {}, http_json_headers.merge(
        'Authorization' => 'Basic ' + Base64.strict_encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
      ) do |response|
        response.status.should eq 200
      end
    end

    it 'returns 401 if header is missing' do
      get_json generate_api_key_url, {}, http_json_headers do |response|
        response.status.should eq 401
      end
    end

    it 'returns 401 if header is malformed' do
      get_json generate_api_key_url, {}, http_json_headers.merge(
        'Authorization' => 'Basicss ' + Base64.encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
      ) do |response|
        response.status.should eq 401
      end
    end

    it 'returns 401 if base64 is malforemd' do
      get_json generate_api_key_url, {}, http_json_headers.merge(
        'Authorization' => 'Basic ' + "asda2" + Base64.encode64("#{@user_api_keys.username}:#{@master_api_key.token}")
      ) do |response|
        response.status.should eq 401
      end
    end
  end

  describe 'password expiration' do
    include HelperMethods

    before(:all) do
      @user = FactoryGirl.create(:valid_user)
      @user.password = @user.password_confirmation = '000qwaszx'
      @user.save
    end

    after(:all) do
      @user.destroy
    end

    let (:session_expired_message) { 'Your session has expired' }

    it 'allows access for non-expired session' do
      # we use this to avoid generating the static assets in CI
      Admin::VisualizationsController.any_instance.stubs(:render).returns('')

      Cartodb.with_config(passwords: { 'expiration_in_d' => nil }) do
        login

        host! "#{@user.username}.localhost.lan"
        get dashboard_url

        expect(response.status).to eq 200
      end
    end

    it 'UI redirects to login page if password is expired' do
      login

      Cartodb.with_config(passwords: { 'expiration_in_d' => 1 }) do
        Delorean.jump(2.days)

        host! "#{@user.username}.localhost.lan"
        get dashboard_url

        expect(response.status).to eq 302
        follow_redirect!

        expect(request.fullpath).to end_with "/login?error=session_expired"
        Delorean.back_to_the_present
      end
    end

    it 'redirects to the original url after changing the expired password' do
      login

      Cartodb.with_config(passwords: { 'expiration_in_d' => 1 }) do
        Delorean.jump(2.days)

        get notifications_url
        follow_redirect!

        login
        follow_redirect!

        change_password_payload = {
          username: @user.username, old_password: @user.password, password: 'pass123', password_confirmation: 'pass123'
        }
        put password_change_url(@user.username), change_password_payload
        follow_redirect!

        request.path.should eq notifications_path

        Delorean.back_to_the_present
      end
    end

    it 'API returns 403 with an error if password is expired' do
      login

      Cartodb.with_config(passwords: { 'expiration_in_d' => 1 }) do
        Delorean.jump(2.days)

        host! "#{@user.username}.localhost.lan"
        get_json api_v3_users_me_url

        expect(response.status).to eq 403
        expect(JSON.parse(response.body)).to eq('error' => 'session_expired')
        Delorean.back_to_the_present
      end
    end

    it 'does not allow access password_change if password is not expired' do
      login

      Cartodb.with_config(passwords: { 'expiration_in_d' => nil }) do
        host! "#{@user.username}.localhost.lan"
        get edit_password_change_path(@user.username)

        expect(response.status).to eq 403
      end
    end

    it 'does not validate password expiration for API-key requests' do
      Cartodb.with_config(passwords: { 'expiration_in_d' => 1 }) do
        Delorean.jump(2.days)

        get_json api_v3_users_me_url, user_domain: @user.username, api_key: @user.api_key do |response|
          expect(response.status).to eq 200
          expect(response.body[:user_data]).to be
        end

        Delorean.back_to_the_present
      end
    end
  end

  shared_examples_for 'login locked' do
    include HelperMethods

    before(:each) do
      SessionsController.any_instance.stubs(:central_enabled?).returns(false)
      # we use this to avoid generating the static assets in CI
      Admin::VisualizationsController.any_instance.stubs(:render).returns('')
    end

    def expect_password_locked
      expect(response.status).to eq 302
      follow_redirect!

      expect(request.fullpath).to include "/login?error=password_locked"
      expect(response.body).to include "Too many failed login attempts"
    end

    def expect_login
      host! "#{@user.username}.localhost.lan"
      get dashboard_url

      expect(response.status).to eq 200
    end

    it 'redirects to login page with an error if password is locked' do
      Cartodb.with_config(
        passwords: {
          'rate_limit' => {
            'max_burst' => 0,
            'count' => 1,
            'period' => 60
          }
        }
      ) do
        @user.reset_password_rate_limit
        wrong_login
        wrong_login

        expect_password_locked
      end
    end

    it 'allows to login after the locked password period' do
      Cartodb.with_config(
        passwords: {
          'rate_limit' => {
            'max_burst' => 0,
            'count' => 1,
            'period' => 1
          }
        }
      ) do
        @user.reset_password_rate_limit
        wrong_login
        wrong_login
        expect_password_locked

        sleep(3)

        login
        expect_login
      end
    end

    it 'does not allow to login during the locked password period' do
      Cartodb.with_config(
        passwords: {
          'rate_limit' => {
            'max_burst' => 0,
            'count' => 1,
            'period' => 10
          }
        }
      ) do
        @user.reset_password_rate_limit
        wrong_login
        wrong_login

        login
        expect_password_locked
      end
    end

    it 'allows to login if password is changed' do
      Cartodb.with_config(
        passwords: {
          'rate_limit' => {
            'max_burst' => 0,
            'count' => 2,
            'period' => 10
          }
        }
      ) do
        @user.reset_password_rate_limit
        wrong_login
        wrong_login
        expect_password_locked

        old_password = @user.password
        new_password = '00012345678'
        @user.password = @user.password_confirmation = new_password

        @user.save

        login
        expect_login

        @user.password = @user.password_confirmation = old_password
        @user.save
      end
    end
  end

  describe 'with Sequel user' do
    it_behaves_like 'login locked' do
      before(:all) do
        @user = FactoryGirl.create(:user, password: '000qwaszx', password_confirmation: '000qwaszx')
      end

      after(:all) do
        @user.destroy
      end
    end
  end

  describe 'with AR user' do
    it_behaves_like 'login locked' do
      before(:all) do
        @user = FactoryGirl.create(:carto_user, password: '000qwaszx', password_confirmation: '000qwaszx')
      end

      after(:all) do
        @user.destroy
      end
    end
  end
end
