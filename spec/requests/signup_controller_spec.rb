require_relative '../spec_helper'

describe SignupController do

  describe 'signup page' do

    it 'returns 404 outside organization subdomains' do
      get signup_url
      response.status.should == 404
      post signup_organization_user_url
      response.status.should == 404
    end

    it 'returns 200 for organizations with signup_page_enabled' do
      fake_organization = FactoryGirl.build(:organization, signup_page_enabled: true )
      Organization.stubs(:where).returns([fake_organization])
      get signup_url
      response.status.should == 200
    end

    it 'returns 404 for organizations without signup_page_enabled' do
      fake_organization = FactoryGirl.build(:organization, signup_page_enabled: false )
      Organization.stubs(:where).returns([fake_organization])
      get signup_url
      response.status.should == 404
    end

  end

  describe 'user creation' do
    include_context 'organization with users helper'

    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      @organization.signup_page_enabled = true
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save
    end

    it 'triggers a NewUser job with form parameters and default quota' do
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser, instance_of(String)).returns(true)

      username = 'testusername'
      email = 'testemail@nonono.com'
      password = 'testpassword' 
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: username, email: email, password: password })
      response.status.should == 200
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      last_user_creation.username.should == username
      last_user_creation.email.should == email
      last_user_creation.crypted_password.should_not be_empty
      last_user_creation.salt.should_not be_empty
      last_user_creation.organization_id.should == @organization.id
      last_user_creation.quota_in_bytes.should == @organization.default_quota_in_bytes
    end

  end

end
