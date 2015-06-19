require_relative '../spec_helper'

describe UsersController do

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
