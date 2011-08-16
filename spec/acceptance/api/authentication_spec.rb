require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API Authentication" do

  background do
    @user = create_user(:email => "client@example.com", :password => "clientex")
    @oauth_consumer = OAuth::Consumer.new(@user.client_application.key, @user.client_application.secret, {
      :site => "http://testhost.lan", :scheme => :query_string, :http_method => :post
    })
    @access_token = AccessToken.create(:user => @user, :client_application => @user.client_application)
  end
  
  scenario "should not authorize requests without signature" do
    response = get api_tables_url
    response.status.should == 401
  end

  describe "Standard OAuth" do
    scenario "should authorize requests with standard plain OAuth" do
      req = prepare_oauth_request(@oauth_consumer, api_tables_url, :token => @access_token)
      response = get req.path, {}, {"Authorization" => req["Authorization"]}
      response.status.should == 200
    end
  end

  describe "xAuth" do
    before(:each) do
      @xauth_params = { :x_auth_username => @user.email, :x_auth_password => "clientex", :x_auth_mode => 'client_auth' }
    end
    
    it "should not return an access token with invalid xAuth params" do
      @xauth_params.merge!(:x_auth_password => "invalid")
      req = prepare_oauth_request(@oauth_consumer, "http://example.org/oauth/access_token", :form_data => @xauth_params)
      
      response = post req.path, @xauth_params, {"Authorization" => req["Authorization"]}
      response.status.should == 401
    end
    
    it "should return access tokens with valid xAuth params" do
      # Not exactly sure why requests come with SERVER_NAME = "example.org"
      req = prepare_oauth_request(@oauth_consumer, "http://example.org/oauth/access_token", :form_data => @xauth_params)
      
      response = post req.path, @xauth_params, {"Authorization" => req["Authorization"]}
      response.status.should == 200
      
      values = response.body.split('&').inject({}) { |h,v| h[v.split("=")[0]] = v.split("=")[1]; h }
      
      new_access_token = OAuth::AccessToken.new(@oauth_consumer, values["oauth_token"], values["oauth_token_secret"])
      
      req = prepare_oauth_request(@oauth_consumer, api_tables_url, :token => new_access_token)
      response = get req.path, {}, {"Authorization" => req["Authorization"]}
      response.status.should == 200
    end
  end
  
  def prepare_oauth_request(consumer, url, options={})
    url = URI.parse(url)
    http = Net::HTTP.new(url.host, url.port)
    req = Net::HTTP::Post.new(url.request_uri)
    req.set_form_data(options[:form_data]) if options[:form_data]
    req.oauth!(http, consumer, options[:token])
    req
  end
end
