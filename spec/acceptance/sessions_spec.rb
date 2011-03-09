require File.expand_path(File.dirname(__FILE__) + '/acceptance_helper')

feature "Sessions" do

  scenario "Login in the application" do
    user = create_user

    visit login_path
    fill_in 'e-mail', :with => user.email
    fill_in 'password', :with => 'blablapassword'
    click_link_or_button 'Log in'

    page.should have_css("input[@type=text].error")
    page.should have_css("input[@type=password].error")
    page.should have_content("Your account or your password is not ok")

    fill_in 'e-mail', :with => user.email
    fill_in 'password', :with => user.email.split('@').first
    click_link_or_button 'Log in'
  end

  scenario "Get the session information via OAuth" do
    Capybara.current_driver = :rack_test
    user = create_user :email => 'fernando.blat@vizzuality.com', :username => 'blat'

    client_application = create_client_application :user => user, :url => "http://www.example.com", :callback_url => "http://www.example.com/oauth/callback/url"

    oauth_consumer = OAuth::Consumer.new(client_application.key, client_application.secret, {
      :site => client_application.url,
      :scheme => :query_string,
      :http_method => :post
    })
    access_token = create_access_token :client_application => client_application, :user => user

    req = oauth_consumer.create_signed_request(:get, "/oauth/identity.json", access_token)
    get req.path

    response.status.should == 200
    json_response = JSON(response.body)
    json_response.should == { 'uid' => user.id, 'email' => 'fernando.blat@vizzuality.com', 'username' => 'blat' }
  end
end
