require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Sessions" do

  scenario "Login in the application" do
    user = create_user

    visit login_path
    fill_in 'email', :with => user.email
    fill_in 'password', :with => 'blablapassword'
    click_link_or_button 'Sign in'

    page.should have_css("input[@type=text].error")
    page.should have_css("input[@type=password].error")
    page.should have_content("Your account or your password is not ok")

    fill_in 'email', :with => user.email
    fill_in 'password', :with => user.email.split('@').first
    click_link_or_button 'Sign in'
  end

  scenario "Get the session information via OAuth" do
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
  end

  scenario "should redirect you to the user login page if unauthorized", :js => true do
    @user  = FactoryGirl.create(:user_with_private_tables, :username => 'test')

    visit api_key_credentials_url(:host => 'test.localhost.lan', :port => Capybara.server_port)
    current_url.should be == login_url(:host => 'test.localhost.lan', :port => Capybara.server_port)
  end

end
