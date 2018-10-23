require 'spec_helper_min'
require 'support/helpers'

describe Carto::Api::MultifactorAuthsController do
  include HelperMethods

  before :all do
    @user = FactoryGirl.create(:carto_user)
  end

  after :all do
    @user.destroy
  end

  after :each do
    @user.user_multifactor_auths.each(&:destroy)
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

    it 'raises error if shared_secret is sent' do
      params = auth_params.merge(create_payload).merge(shared_secret: 'wadus')
      post_json multifactor_auths_url, params, auth_headers do |response|
        response.status.should eq 422
        response = response.body
        response[:errors].should include("The 'shared_secret' parameter is not allowed for this endpoint")
      end
    end

    it 'creates a totp multifactor auth and ignores additional params' do
      params = auth_params.merge(create_payload).merge(code: 'wadus', enabled: true)
      post_json multifactor_auths_url, params, auth_headers do |response|
        response.status.should eq 201
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq false
        response[:qrcode].should be
        response[:user].should eq(@user.username)

        @user.user_multifactor_auths.find(response[:id]).code.should be_nil
      end
    end
  end

  describe '#validate_code' do
    before :each do
      @multifactor_auth = FactoryGirl.create(:totp, user: @user)
    end

    after :each do
      @multifactor_auth.destroy
    end

    it 'validates a totp multifactor auth code' do
      params = auth_params.merge(code: @multifactor_auth.totp.now)
      post_json validate_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.code.should eq params[:code]
        @multifactor_auth.disabled?.should be_false
        @multifactor_auth.last_login.should be
      end
    end

    it 'raises error if not valid code' do
      params = auth_params.merge(code: '123456')
      post_json validate_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 403
        response = response.body
        response[:errors].should include("The code is not valid")
      end
    end

    it 'raises error if shared_secret is sent' do
      params = auth_params.merge(shared_secret: 'wadus')
      post_json validate_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 422
        response = response.body
        response[:errors].should include("The 'shared_secret' parameter is not allowed for this endpoint")
      end
    end

    it 'validates and ignores additional params' do
      params = auth_params.merge(code: @multifactor_auth.totp.now, last_login: Time.now - 1.year)
      post_json validate_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.code.should eq params[:code]
        @multifactor_auth.disabled?.should be_false
        @multifactor_auth.last_login.year.should eq Time.now.year
      end
    end

    it 'updates last_login' do
      @multifactor_auth.verify!(@multifactor_auth.totp.now)
      last_login = @multifactor_auth.last_login
      params = auth_params.merge(code: @multifactor_auth.totp.now)
      post_json validate_multifactor_auth_url(id: @multifactor_auth.id), params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:enabled].should eq true
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @multifactor_auth.reload
        @multifactor_auth.code.should eq params[:code]
        @multifactor_auth.disabled?.should be_false
        @multifactor_auth.last_login.should_not eq last_login
      end
    end
  end

  describe '#destroy' do
    before :each do
      @multifactor_auth = FactoryGirl.create(:totp, user: @user)
    end

    after :each do
      @multifactor_auth.destroy
    end

    it 'destroys a multifactor auth instance' do
      delete_json multifactor_auth_url(id: @multifactor_auth.id), auth_params, auth_headers do |response|
        response.status.should eq 200
        response = response.body
        response[:id].should be
        response[:type].should eq 'totp'
        response[:qrcode].should_not be
        response[:user].should eq(@user.username)

        @user.user_multifactor_auths.where(id: response[:id]).should be_empty
      end
    end
  end
end
