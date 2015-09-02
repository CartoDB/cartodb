# encoding: utf-8
require_relative '../acceptance_helper'

feature "Sessions" do
  before do
    @banned_user_agents = [
      "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)",
      "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 2.0.50727; Media Center PC 6.0)",
      "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 5.0; Trident/4.0; FBSMTWB; .NET CLR 2.0.34861; .NET CLR 3.0.3746.3218; .NET CLR 3.5.33652; msn OptimizedIE8;ENUS)",
      "Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)",
      "Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)",
      "Mozilla/4.0 (compatible; MSIE 6.01; Windows NT 6.0)",
      "Mozilla/4.0 (compatible; MSIE 5.5b1; Mac_PowerPC)",
      "Mozilla/5.0 (Macintosh; U; PPC Mac OS X; de-de) AppleWebKit/412.7 (KHTML, like Gecko) Safari/412.5"
    ]

    @allowed_user_agents = [
      "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
      "Mozilla/5.0 (Windows NT 6.1; rv:15.0) Gecko/20120716 Firefox/15.0a2",
      "Mozilla/5.0 (Windows NT 5.1; rv:8.0; en_us) Gecko/20100101 Firefox/8.0",
      "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10",
      "Opera/9.80 (Windows NT 6.1; U; es-ES) Presto/2.9.181 Version/12.00",
      "Opera/9.80 (X11; Linux x86_64; U; fr) Presto/2.9.168 Version/11.50"
    ]
  end

  scenario "Login in the application" do
    Capybara.current_driver = :rack_test
    user = create_user

    visit login_path
    fill_in 'email', :with => user.email
    fill_in 'password', :with => 'blablapassword'
    click_link_or_button 'Login'

    page.should have_css(".Sessions-fieldError.js-Sessions-fieldError")
    page.should have_css("[@data-content='Your account or your password is not ok']")

    fill_in 'email', :with => user.email
    fill_in 'password', :with => user.email.split('@').first
    click_link_or_button 'Login'
    page.should have_css(".ContentController")

    user.destroy
  end

  xit "Get the session information via OAuth" do
    Capybara.current_driver = :rack_test
    user = create_user :email => 'fernando.blat@vizzuality.com', :username => 'blat'

    client_application = create_client_application :user => user, :url => CartoDB.hostname, :callback_url => CartoDB.hostname

    oauth_consumer = OAuth::Consumer.new(client_application.key, client_application.secret, {
      :site => client_application.url,
      :scheme => :query_string,
      :http_method => :post
    })
    access_token = create_access_token :client_application => client_application, :user => user
    identity_uri = "http://vizzuality.testhost.lan/oauth/identity.json"
    req = prepare_oauth_request(oauth_consumer, identity_uri, :token => access_token)
    get_json identity_uri, {}, {'Authorization' => req["Authorization"]} do |response|
      response.status.should be_success
      response.body.should == { :uid => user.id, :email => 'fernando.blat@vizzuality.com', :username => 'blat' }
    end

    user.destroy
  end

  xit "should redirect you to the user login page if unauthorized", :js => true do
    @user  = FactoryGirl.create(:user_with_private_tables, :username => 'test')

    visit api_key_credentials_url(:host => 'test.localhost.lan', :port => Capybara.server_port)
    current_url.should be == login_url(:host => 'test.localhost.lan', :port => Capybara.server_port)
  end


  xit "should show error page when trying to connect with unsupported browser" do
    @banned_user_agents.each do |user_agent|
      options = page.driver.instance_variable_get("@options")
      options[:headers] = {"HTTP_USER_AGENT" => user_agent}
      page.driver.instance_variable_set "@options", options

      visit '/login'

      page.should have_content("You have to update your browser in order to use CartoDB")
    end
  end

  xit "shouldn't show error page when trying to connect with supported browser" do
    @allowed_user_agents.each do |user_agent|
      options = page.driver.instance_variable_get("@options")
      options[:headers] = {"HTTP_USER_AGENT" => user_agent}
      page.driver.instance_variable_set "@options", options

      visit '/login'

      page.should have_content("Login to your CartoDB")
    end
  end

  def login(page)
    page.find("button.Sessions-button").click
  end

  xit "doesn't allow to login from a different domain than user account domain" do
    Capybara.current_driver = :rack_test
    user1  = FactoryGirl.create(:user_with_private_tables, :username => 'email1')
    user2  = FactoryGirl.create(:user_with_private_tables, :username => 'email2')

    visit login_url(:subdomain => user2.username, :port => Capybara.server_port)

    fill_in 'email', :with => user1.email
    fill_in 'password', :with => user1.email.split('@').first

    login(page)
    follow_redirect!

    page.should have_css(".Sessions-fieldError.js-Sessions-fieldError")
    page.should have_css("[@data-content='Your account or your password is not ok']")

    fill_in 'email', :with => user2.email
    fill_in 'password', :with => user2.email.split('@').first

    login(page)

    page.should_not have_css("[@data-content='Your account or your password is not ok']")
  end
end

