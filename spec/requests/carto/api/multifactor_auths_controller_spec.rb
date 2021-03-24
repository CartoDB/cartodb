require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::MultifactorAuthsController do
  include HelperMethods

  before :all do
    @user = create(:carto_user)
  end

  after :all do
    @user.destroy
  end

  before :each do
    @user.user_multifactor_auths.each(&:destroy)
    @multifactor_auth = create(:totp, :active, user: @user)
    @totp = ROTP::TOTP.new(@multifactor_auth.shared_secret)
    @user.reload
  end

  after :each do
    @user.user_multifactor_auths.each(&:destroy)
    @multifactor_auth.destroy
  end

  def auth_headers
    http_json_headers
  end

  def auth_params
    { user_domain: @user.username, api_key: @user.api_key }
  end

  let(:create_payload) do
    {
      type: 'totp',
      user_id: @user.id
    }
  end

  describe '#create' do
    before(:each) do
      @user.user_multifactor_auths.each(&:destroy)
      @user.reload
    end

    it 'creates a totp multifactor auth' do
      post_json multifactor_auths_url, auth_params.merge(create_payload), auth_headers do |response|
        response.status.should eq 201
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq false
        response[:qrcode].should be
        response[:user].should eq(@user.username)
      end
    end

    it 'requires the type' do
      params = auth_params.merge(create_payload.except(:type))
      post_json multifactor_auths_url, params, auth_headers do |response|
        response.status.should eq 422
        response = response.body
        response[:errors].should include("param is missing or the value is empty: type")
      end
    end

    it 'creates a totp multifactor auth and ignores additional params' do
      params = auth_params.merge(create_payload).merge(enabled: true)
      post_json multifactor_auths_url, params, auth_headers do |response|
        response.status.should eq 201
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq false
        response[:qrcode].should be
        response[:user].should eq(@user.username)

        @user.user_multifactor_auths.find(response[:id]).enabled.should be false
      end
    end
  end

  describe '#validate_code' do
    it 'validates a totp multifactor auth code' do
      params = auth_params.merge(code: @totp.now)
      post_json verify_code_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.needs_setup?.should be_false
        @multifactor_auth.last_login.should be
      end
    end

    it 'raises error if not valid code' do
      params = auth_params.merge(code: '123456')
      post_json verify_code_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 403
        response = response.body
        response[:errors].should include("The code is not valid")
      end
    end

    it 'validates and ignores additional params' do
      params = auth_params.merge(code: @totp.now, last_login: Time.now - 1.year)
      post_json verify_code_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.needs_setup?.should be_false
        @multifactor_auth.last_login.year.should eq Time.now.year
      end
    end

    it 'updates last_login' do
      @multifactor_auth.verify!(@totp.now)
      last_login = @multifactor_auth.last_login
      Delorean.jump(2.hours)
      params = auth_params.merge(code: @totp.now)
      post_json verify_code_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.needs_setup?.should be_false
        @multifactor_auth.last_login.should_not eq last_login
      end
      Delorean.back_to_the_present
    end
  end

  describe '#show' do
    it 'shows multifactor auth instance' do
      get_json multifactor_auth_url(id: @multifactor_auth.id), auth_params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)
      end
    end
  end

  describe '#index' do
    it 'list instances' do
      get_json multifactor_auths_url, auth_params, auth_headers do |response|
        response.status.should eq 200
        list = response.body
        list.length.should eq 1
        response = list.first
        response['id'].should be
        response['type'].should eq 'totp'
        response['qrcode'].should_not be
        response['user'].should eq(@user.username)
      end
    end
  end

  describe '#destroy' do
    it 'destroys a multifactor auth instance' do
      delete_json multifactor_auth_url(id: @multifactor_auth.id), auth_params, auth_headers do |response|
        response.status.should eq 204

        @user.user_multifactor_auths.where(id: response[:id]).should be_empty
      end
    end
  end
end
