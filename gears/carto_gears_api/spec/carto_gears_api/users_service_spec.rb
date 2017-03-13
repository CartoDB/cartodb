require 'spec_helper'
require 'carto_gears_api/users/users_service'

describe CartoGearsApi::Users::UsersService do
  describe '#logged_user' do
    module CartoDB; end

    let(:id) { 'b51e56fb-f3c9-463f-b950-d9be188551e5' }
    let(:username) { 'wadus_username' }
    let(:email) { 'wadus@carto.com' }

    let(:service) { CartoGearsApi::Users::UsersService.new }

    # This test is 100% bound to implementation. It's mostly a PoC for unit testing
    # within Gears and should not be used as an example.
    it 'returns the logged user based on subdomain and warden' do
      user = double
      user.stub(:id).and_return(id)
      user.stub(:username).and_return(username)
      user.stub(:email).and_return(email)
      user.stub(:organization).and_return(nil)
      user.stub(:feature_flags).and_return([])
      warden = double
      warden.should_receive(:user).once.and_return(user)
      request = double
      request.should_receive(:env).once.and_return('warden' => warden)
      CartoDB.should_receive(:extract_subdomain).with(request).and_return(username)

      logged_user = service.logged_user(request)
      logged_user.email.should eq user.email
    end
  end
end
