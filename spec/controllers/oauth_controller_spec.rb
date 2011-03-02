require File.dirname(__FILE__) + '/../spec_helper'
require File.dirname(__FILE__) + '/oauth_controller_spec_helper'
require 'json'
describe OauthController do
  if defined?(Devise)
    include Devise::TestHelpers
  end
  include OAuthControllerSpecHelper
  fixtures :client_applications, :oauth_tokens, :users
  describe "getting a request token" do
    before(:each) do
      sign_request_with_oauth
      ClientApplication.stub!(:find_by_key).and_return(current_client_application)
    end

    def do_get
      get :request_token
    end

    it "should be successful" do
      do_get
      response.should be_success
    end

    it "should query for client_application" do
      ClientApplication.should_receive(:find_by_key).with(current_client_application.key).and_return(current_client_application)
      do_get
    end

    it "should request token from client_application" do
      current_client_application.should_receive(:create_request_token).and_return(request_token)
      do_get
    end

    it "should return token string" do
      do_get
      response.body.should==RequestToken.last.to_query
    end

    it "should not set token_callback_url" do
      current_client_application.should_not_receive(:token_callback_url=)
      do_get
    end
  end

  describe "getting a request token passing a oauth_callback url" do
    before(:each) do
      sign_request_with_oauth nil, {:oauth_callback=>"http://test.com/alternative_callback"}
      ClientApplication.stub!(:find_by_key).and_return(current_client_application)
    end

    def do_get
      get :request_token
    end

    it "should be successful" do
      do_get
      response.should be_success
    end

    it "should query for client_application" do
      ClientApplication.should_receive(:find_by_key).with(current_client_application.key).and_return(current_client_application)
      do_get
    end

    it "should request token from client_application" do
      current_client_application.should_receive(:create_request_token).and_return(request_token)
      do_get
    end

    it "should return token string" do
      do_get
      response.body.should==RequestToken.last.to_query
    end

    it "should set token_callback_url with received oauth_callback" do
      current_client_application.should_receive(:token_callback_url=).with("http://test.com/alternative_callback")
      do_get
    end
  end

  describe "10a token authorization" do
    before(:each) do
      login
      RequestToken.stub!(:find_by_token).and_return(request_token)
    end

    def do_get
      get :authorize, :oauth_token => request_token.token
    end

    it "should show authorize page" do
      do_get
      response.should render_template("authorize")
    end

    it "should authorize token" do
      request_token.should_not_receive(:authorize!).with(current_user)
      do_get
    end

    it "should redirect if token is invalidated" do
      request_token.invalidate!
      do_get
      response.should render_template("authorize_failure")
    end

  end

  describe "10a token authorization" do
    before(:each) do
      login
      RequestToken.stub!(:find_by_token).and_return(request_token)
    end

    def do_post
      post :authorize, :oauth_token => request_token.token, :authorize=>"1"
    end

    it "should redirect to default callback" do
      do_post
      response.should be_redirect
      response.should redirect_to("http://application/callback?oauth_token=#{request_token.token}&oauth_verifier=#{request_token.verifier}")
    end

    it "should authorize token" do
      request_token.should_receive(:authorize!).with(current_user)
      do_post
    end

    it "should redirect if token is invalidated" do
      request_token.invalidate!
      do_post
      response.should render_template("authorize_failure")
    end

  end

  describe "2.0 authorization code flow" do
    before(:each) do
      login
    end

    describe "authorize redirect" do
      before(:each) do
        get :authorize, :response_type=>"code",:client_id=>current_client_application.key, :redirect_url=>"http://application/callback"
      end

      it "should render authorize" do
        response.should render_template("oauth2_authorize")
      end

      it "should not create token" do
        Oauth2Verifier.last.should be_nil
      end
    end

    describe "authorize" do
      before(:each) do
        post :authorize, :response_type=>"code",:client_id=>current_client_application.key, :redirect_url=>"http://application/callback",:authorize=>"1"
        @verification_token = Oauth2Verifier.last
        @oauth2_token_count= Oauth2Token.count
      end
      subject { @verification_token }

      it { should_not be_nil }
      it "should set user on verification token" do
        @verification_token.user.should==current_user
      end

      it "should set redirect_url" do
        @verification_token.redirect_url.should == "http://application/callback"
      end

      it "should redirect to default callback" do
        response.should be_redirect
        response.should redirect_to("http://application/callback?code=#{@verification_token.code}")
      end

      describe "get token" do
        before(:each) do
          post :token, :grant_type=>"authorization_code", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :redirect_url=>"http://application/callback",:code=>@verification_token.code
          @token = Oauth2Token.last
        end

        subject { @token }

        it { should_not be_nil }
        it { should be_authorized }
        it "should have added a new token" do
          Oauth2Token.count.should==@oauth2_token_count+1
        end

        it "should set user to current user" do
          @token.user.should==current_user
        end

        it "should return json token" do
          JSON.parse(response.body).should=={"access_token"=>@token.token}
        end
      end

      describe "get token with wrong secret" do
        before(:each) do
          post :token, :grant_type=>"authorization_code", :client_id=>current_client_application.key,:client_secret=>"fake", :redirect_url=>"http://application/callback",:code=>@verification_token.code
        end

        it "should not create token" do
          Oauth2Token.count.should==@oauth2_token_count
        end

        it "should return incorrect_client_credentials error" do
          JSON.parse(response.body).should == {"error"=>"invalid_client"}
        end
      end

      describe "get token with wrong code" do
        before(:each) do
          post :token, :grant_type=>"authorization_code", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :redirect_url=>"http://application/callback",:code=>"fake"
        end

        it "should not create token" do
          Oauth2Token.count.should==@oauth2_token_count
        end

        it "should return incorrect_client_credentials error" do
          JSON.parse(response.body).should == {"error"=>"invalid_grant"}
        end
      end

      describe "get token with wrong redirect_url" do
        before(:each) do
          post :token, :grant_type=>"authorization_code", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :redirect_url=>"http://evil/callback",:code=>@verification_token.code
        end

        it "should not create token" do
          Oauth2Token.count.should==@oauth2_token_count
        end

        it "should return incorrect_client_credentials error" do
          JSON.parse(response.body).should == {"error"=>"invalid_grant"}
        end
      end

    end

    describe "deny" do
      before(:each) do
        post :authorize, :response_type=>"code", :client_id=>current_client_application.key, :redirect_url=>"http://application/callback",:authorize=>"0"
      end

      it { Oauth2Verifier.last.should be_nil }

      it "should redirect to default callback" do
        response.should be_redirect
        response.should redirect_to("http://application/callback?error=user_denied")
      end
    end

  end


  describe "2.0 authorization token flow" do
    before(:each) do
      login
      current_client_application # load up so it creates its own token
      @oauth2_token_count= Oauth2Token.count
    end

    describe "authorize redirect" do
      before(:each) do
        get :authorize, :response_type=>"token",:client_id=>current_client_application.key, :redirect_url=>"http://application/callback"
      end

      it "should render authorize" do
        response.should render_template("oauth2_authorize")
      end

      it "should not create token" do
        Oauth2Verifier.last.should be_nil
      end
    end

    describe "authorize" do
      before(:each) do
        post :authorize, :response_type=>"token",:client_id=>current_client_application.key, :redirect_url=>"http://application/callback",:authorize=>"1"
        @token = Oauth2Token.last
      end
      subject { @token }
      it "should redirect to default callback" do
        response.should be_redirect
        response.should redirect_to("http://application/callback?access_token=#{@token.token}")
      end

      it "should not have a scope" do
        @token.scope.should be_nil
      end
      it { should_not be_nil }
      it { should be_authorized }

      it "should set user to current user" do
        @token.user.should==current_user
      end

      it "should have added a new token" do
        Oauth2Token.count.should==@oauth2_token_count+1
      end
    end

    describe "deny" do
      before(:each) do
        post :authorize, :response_type=>"token", :client_id=>current_client_application.key, :redirect_url=>"http://application/callback",:authorize=>"0"
      end

      it { Oauth2Verifier.last.should be_nil }

      it "should redirect to default callback" do
        response.should be_redirect
        response.should redirect_to("http://application/callback?error=user_denied")
      end
    end
  end

  describe "oauth2 token for autonomous client_application" do
    before(:each) do
      current_client_application
      @oauth2_token_count = Oauth2Token.count
      post :token, :grant_type=>"none", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret
      @token = Oauth2Token.last
    end

    subject { @token }

    it { should_not be_nil }
    it { should be_authorized }
    it "should set user to client_applications user" do
      @token.user.should==current_client_application.user
    end
    it "should have added a new token" do
      Oauth2Token.count.should==@oauth2_token_count+1
    end

    it "should return json token" do
      JSON.parse(response.body).should=={"access_token"=>@token.token}
    end
  end

  describe "oauth2 token for autonomous client_application with invalid client credentials" do
    before(:each) do
      current_client_application
      @oauth2_token_count = Oauth2Token.count
      post :token, :grant_type=>"none", :client_id=>current_client_application.key,:client_secret=>"bad"
    end

    subject { @token }

    it "should not have added a new token" do
      Oauth2Token.count.should==@oauth2_token_count
    end

    it "should return json token" do
      JSON.parse(response.body).should=={"error"=>"invalid_client"}
    end
  end


  describe "oauth2 token for basic credentials" do
    before(:each) do
      current_client_application
      @oauth2_token_count = Oauth2Token.count
      post :token, :grant_type=>"password", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :username=>current_user.login, :password=>"password"
      @token = Oauth2Token.last
    end

    subject { @token }

    it { should_not be_nil }
    it { should be_authorized }
    it "should set user to client_applications user" do
      @token.user.should==current_user
    end
    it "should have added a new token" do
      Oauth2Token.count.should==@oauth2_token_count+1
    end

    it "should return json token" do
      JSON.parse(response.body).should=={"access_token"=>@token.token}
    end
  end

  describe "oauth2 token for basic credentials with wrong password" do
    before(:each) do
      current_client_application
      @oauth2_token_count = Oauth2Token.count
      post :token, :grant_type=>"password", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :username=>current_user.login, :password=>"bad"
    end

    it "should not have added a new token" do
      Oauth2Token.count.should==@oauth2_token_count
    end

    it "should return json token" do
      JSON.parse(response.body).should=={"error"=>"invalid_grant"}
    end
  end

  describe "oauth2 token for basic credentials with unknown user" do
    before(:each) do
      current_client_application
      @oauth2_token_count = Oauth2Token.count
      post :token, :grant_type=>"password", :client_id=>current_client_application.key,:client_secret=>current_client_application.secret, :username=>"non existent", :password=>"password"
    end

    it "should not have added a new token" do
      Oauth2Token.count.should==@oauth2_token_count
    end

    it "should return json token" do
      JSON.parse(response.body).should=={"error"=>"invalid_grant"}
    end
  end

  describe "getting an access token" do
    before(:each) do
      request_token.authorize!(current_user)
      request_token.reload
      sign_request_with_oauth consumer_request_token, :oauth_verifier=>request_token.verifier
    end

    def do_get
      post :access_token
    end

    it "should have a verifier" do
      request_token.verifier.should_not be_nil
    end

    it "should be authorized" do
      request_token.should be_authorized
    end

    it "should be successful" do
      do_get
      response.should be_success
    end

    it "should request token from client_application" do
      controller.stub!(:current_token).and_return(request_token)
      request_token.should_receive(:exchange!).and_return(access_token)
      do_get
    end

    it "should return token string" do
      do_get
      response.body.should == AccessToken.last.to_query
    end

    describe "access token" do
      before(:each) do
        do_get
        access_token=AccessToken.last
      end

      it "should have user set" do
        access_token.user.should==current_user
      end

      it "should be authorized" do
        access_token.should be_authorized
      end
    end
  end

  describe "invalidate" do
    before(:each) do
      sign_request_with_oauth access_token
      get :invalidate
    end

    it "should be a success" do
      response.code.should=="410"
    end
  end

end

class OauthorizedController<ApplicationController
  before_filter :login_required,                               :only => :interactive
  oauthenticate                                                :only => :all
  oauthenticate :strategies=>:token,                           :only=>:interactive_and_token
  oauthenticate :strategies=>:two_legged,                      :only=>:interactive_and_two_legged
  oauthenticate :interactive=>false,                           :only=>:no_interactive
  oauthenticate :interactive=>false, :strategies=>:token,      :only=>:token
  oauthenticate :interactive=>false, :strategies=>:two_legged, :only=>:two_legged
  before_filter :oauth_required,                               :only=>:token_legacy
  before_filter :login_or_oauth_required,                      :only=>:both_legacy

  def interactive
    head :ok
  end

  def all
    head :ok
  end

  def token
    head :ok
  end

  def interactive_and_token
    head :ok
  end

  def interactive_and_two_legged
    head :ok
  end

  def two_legged
    head :ok
  end

  def token_legacy
    head :ok
  end

  def both_legacy
    head :ok
  end
end

describe OauthorizedController, " access control" do
  fixtures :client_applications, :oauth_tokens, :users
  if defined?(Devise)
    include Devise::TestHelpers
  end
  include OAuthControllerSpecHelper

  it "should return false for oauth? by default" do
    controller.send(:oauth?).should == false
  end

  it "should return nil for current_token  by default" do
    controller.send(:current_token).should be_nil
  end

  describe "oauth 10a" do

    describe "request token signed" do
      before(:each) do
        sign_request_with_oauth(request_token)
      end

      it "should disallow oauth using RequestToken when using oauth_required" do
        get :token
        response.code.should == '401'
      end
    end

    describe "access token signed" do
      before(:each) do
        sign_request_with_oauth(access_token)
      end

      [:interactive,:two_legged,:interactive_and_two_legged].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should_not be_success
          end

          it "should not set current_token" do
            controller.send(:current_token).should be_nil
          end

          it "should not set current_client_application" do
            controller.send(:current_client_application).should be_nil
          end

          it "should not set current_user" do
            controller.send(:current_user).should be_nil
          end
        end
      end

      [:token,:interactive_and_token,:all,:token_legacy,:both_legacy].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should be_success
          end

          it "should set current_token" do
            controller.send(:current_token).should == access_token
          end

          it "should set current_client_application" do
            controller.send(:current_client_application).should == current_client_application
          end

          it "should set current_user" do
            controller.send(:current_user).should == current_user
          end
        end
      end
    end

    describe "2 legged" do
      before(:each) do
        two_legged_sign_request_with_oauth(current_consumer)
      end

      [:token,:interactive_and_token,:interactive,:token_legacy,:both_legacy].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should_not be_success
          end

          it "should not set current_token" do
            controller.send(:current_token).should be_nil
          end

          it "should not set current_client_application" do
            controller.send(:current_client_application).should be_nil
          end

          it "should not set current_user" do
            controller.send(:current_user).should be_nil
          end
        end
      end

      [:two_legged,:interactive_and_two_legged,:all].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should be_success
          end

          it "should not set current_token" do
            controller.send(:current_token).should be_nil
          end

          it "should set current_client_application" do
            controller.send(:current_client_application).should == current_client_application
          end

          it "should set current_user" do
            controller.send(:current_user).should == current_client_application.user
          end
        end
      end
    end

  end

  describe "oauth 2.0" do
    before(:each) do
      @access_token = Oauth2Token.create :user=>current_user, :client_application=>current_client_application
      @client_application = @access_token.client_application
    end
    describe "authorize header" do
      before(:each) do
        add_oauth2_token_header(access_token)
      end

      it "should include headers" do
        get :interactive_and_token
        request.authorization.should == "OAuth #{access_token.token}"
      end

      [:interactive,:two_legged,:interactive_and_two_legged,:token_legacy,:both_legacy].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should_not be_success
          end

          it "should not set current_token" do
            controller.send(:current_token).should be_nil
          end

          it "should not set current_client_application" do
            controller.send(:current_client_application).should be_nil
          end

          it "should not set current_user" do
            controller.send(:current_user).should be_nil
          end
        end
      end

      [:token,:interactive_and_token,:all].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action
          end

          it "should not be a success" do
            response.should be_success
          end

          it "should set current_token" do
            controller.send(:current_token).should == access_token
          end

          it "should set current_client_application" do
            controller.send(:current_client_application).should == current_client_application
          end

          it "should set current_user" do
            controller.send(:current_user).should == current_user
          end
        end
      end
    end

    describe "query string" do
      [:interactive,:two_legged,:interactive_and_two_legged,:token_legacy,:both_legacy].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action, :oauth_token=>access_token.token
          end

          it "should not be a success" do
            response.should_not be_success
          end

          it "should not set current_token" do
            controller.send(:current_token).should be_nil
          end

          it "should not set current_client_application" do
            controller.send(:current_client_application).should be_nil
          end

          it "should not set current_user" do
            controller.send(:current_user).should be_nil
          end
        end
      end

      [:token,:interactive_and_token,:all].each do |action|
        describe "accessing #{action.to_s.humanize}" do
          before(:each) do
            get action, :oauth_token=>access_token.token
          end

          it "should not be a success" do
            response.should be_success
          end

          it "should set current_token" do
            controller.send(:current_token).should == access_token
          end

          it "should set current_client_application" do
            controller.send(:current_client_application).should == current_client_application
          end

          it "should set current_user" do
            controller.send(:current_user).should == current_user
          end
        end
      end

    end

  end

  describe "logged in user" do
    before(:each) do
      login
    end


    [:token,:two_legged,:token_legacy].each do |action|
      describe "accessing #{action.to_s.humanize}" do
        before(:each) do
          get action, :oauth_token=>access_token.token
        end

        it "should not be a success" do
          response.should_not be_success
        end

        it "should not set current_token" do
          controller.send(:current_token).should be_nil
        end

        it "should not set current_client_application" do
          controller.send(:current_client_application).should be_nil
        end

      end
    end

    [:interactive,:interactive_and_two_legged,:interactive_and_token,:all,:both_legacy].each do |action|
      describe "accessing #{action.to_s.humanize}" do
        before(:each) do
          get action, :oauth_token=>access_token.token
        end

        it "should not be a success" do
          response.should be_success
        end

        it "should not set current_token" do
          controller.send(:current_token).should be_nil
        end

        it "should not set current_client_application" do
          controller.send(:current_client_application).should be_nil
        end

        it "should set current_user" do
          controller.send(:current_user).should == current_user
        end
      end
    end
  end
end

