# encoding: utf-8
require_relative '../spec_helper'

describe "API Authentication" do
  before(:each) do
    User.all.each(&:destroy)
    @user = create_user(:email => "client@example.com", :password => "clientex")
    @user.reset_client_application!
    @user.reload
    @user.set_map_key
    @oauth_consumer = OAuth::Consumer.new(@user.client_application.key, @user.client_application.secret, {
      :site => "http://testhost.lan", :scheme => :query_string, :http_method => :post
    })
    @access_token = AccessToken.create(:user => @user, :client_application => @user.client_application)
  end

  it "should not authorize requests without signature" do
    get "http://vizzuality.testhost.lan/api/v1/tables"
    status.should == 401
  end

  describe "Standard OAuth" do

    before(:each) do
      # We need to specify the complete url in both the prepare_oauth_request method call which we use to build a request from which to take the Authorization header
      # and also when making the request otherwise get/post integration test methods will use example.org
      @request_url = "http://vizzuality.testhost.lan/api/v1/tables"
    end

    it "should authorize requests properly signed" do
      req = prepare_oauth_request(@oauth_consumer, @request_url, :token => @access_token)
      get @request_url, {}, {"Authorization" => req["Authorization"]}
      status.should == 200
    end

    it "should not authorize requests with wrong signature" do
      req = prepare_oauth_request(@oauth_consumer, @request_url, :token => @access_token)
      get @request_url, {}, {"Authorization" => req["Authorization"].gsub('oauth_signature="','oauth_signature="314')}
      status.should == 401
    end
  end

  describe "xAuth" do
    before(:each) do
      @request_url = "http://vizzuality.testhost.lan/oauth/access_token"
      @xauth_params = { :x_auth_username => @user.email, :x_auth_password => "clientex", :x_auth_mode => 'client_auth' }
    end

    it "should return 401 if request is not signed" do
      post @request_url, @xauth_params
      status.should == 401
    end

    it "should not return an access token with invalid xAuth params" do
      @xauth_params.merge!(:x_auth_password => "invalid")
      req = prepare_oauth_request(@oauth_consumer, @request_url, :form_data => @xauth_params)

      post @request_url, @xauth_params, {"Authorization" => req["Authorization"]}
      status.should == 401
    end

    it "should return access tokens with valid xAuth params" do
      # Not exactly sure why requests come with SERVER_NAME = "example.org"
      req = prepare_oauth_request(@oauth_consumer, @request_url, :form_data => @xauth_params)

      post @request_url, @xauth_params, {"Authorization" => req["Authorization"]}
      status.should == 200

      values = response.body.split('&').inject({}) { |h,v| h[v.split("=")[0]] = v.split("=")[1]; h }

      new_access_token = OAuth::AccessToken.new(@oauth_consumer, values["oauth_token"], values["oauth_token_secret"])

      tables_uri = "http://vizzuality.testhost.lan/api/v1/tables"
      req = prepare_oauth_request(@oauth_consumer, tables_uri, :token => new_access_token)
      get tables_uri, {}, {"Authorization" => req["Authorization"]}
      status.should == 200
    end
  end

  describe "Api key auth" do
    before(:each) do
      @random_string = (0...8).map{65.+(rand(25)).chr}.join
    end

    it "should grant access using a valid api_key param" do
      get v1_tables_path, {:api_key => @user.api_key}, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 200
    end

    it "should not grant access using an invalid api_key param" do
      get v1_tables_path, {:api_key => @random_string }, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 401
    end

    it "should not grant access not using any kind of authentication" do
      get v1_tables_path, {}, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 401
    end

    it "should not grant access after regenerating the api_key and keep using the old one" do
      get v1_tables_path, {:api_key => @user.api_key}, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 200

      old_api_key = @user.api_key
      @user.set_map_key

      get v1_tables_path, {:api_key => old_api_key}, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 401

      get v1_tables_path, {:api_key => @user.api_key}, {'HTTP_HOST' => "#{@user.username}.testhost.lan"}
      status.should == 200
    end
  end
end

