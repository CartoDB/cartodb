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
      fake_organization = FactoryGirl.build(:organization, whitelisted_email_domains: ['cartodb.com'] )
      Organization.stubs(:where).returns([fake_organization])
      get signup_url
      response.status.should == 200
    end

    it 'returns 404 for organizations without signup_page_enabled' do
      fake_organization = FactoryGirl.build(:organization, whitelisted_email_domains: [] )
      Organization.stubs(:where).returns([fake_organization])
      get signup_url
      response.status.should == 404
    end

    it 'returns user error with admin mail if organization has not enough seats' do
      fake_owner = FactoryGirl.build(:valid_user)
      fake_organization = FactoryGirl.build(:organization, whitelisted_email_domains: ['cartodb.com'], seats: 0, owner: fake_owner)
      Organization.stubs(:where).returns([fake_organization])
      get signup_url
      response.status.should == 200
      response.body.should match(/Please, contact with the administrator of #{fake_organization.name}/)
      response.body.should match(Regexp.new fake_organization.owner.email)
    end

  end

  describe 'user creation' do
    include_context 'organization with users helper'

    DEFAULT_QUOTA_IN_BYTES = 1000

    before(:all) do
      @organization.whitelisted_email_domains = ['cartodb.com']
      @organization.default_quota_in_bytes = DEFAULT_QUOTA_IN_BYTES
      @organization.save
    end

    it 'triggers validation error and not a NewUser job if email is not valid' do
      ::Resque.expects(:enqueue).never

      username = 'testusername'
      email = 'testemail@nonono.com'
      password = 'testpassword'
      host! "#{@organization.name}.localhost.lan"
      post signup_organization_user_url(user_domain: @organization.name, user: { username: username, email: email, password: password })
      response.status.should == 200
      last_user_creation = Carto::UserCreation.order('created_at desc').limit(1).first
      last_user_creation.should == nil
    end

    it 'triggers a NewUser job with form parameters and default quota' do
      ::Resque.expects(:enqueue).with(::Resque::UserJobs::Signup::NewUser, instance_of(String)).returns(true)

      username = 'testusername'
      email = "testemail@#{@organization.whitelisted_email_domains[0]}"
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
