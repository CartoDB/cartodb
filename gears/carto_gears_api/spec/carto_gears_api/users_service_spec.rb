require 'spec_helper'
require 'carto_gears_api/users_service'

describe CartoGearsApi::UsersService do
  describe '#logged_user' do
    module CartoDB; end

    let(:username) { 'wadus_username' }
    let(:email) { 'wadus@carto.com' }

    let(:service) { CartoGearsApi::UsersService.new }

    # This test is 100% bound to implementation. It's mostly a PoC for unit testing
    # within Gears and should not be used as an example.
    it 'returns the logged user based on subdomain and warden' do
      user = double
      user.stub(:email).and_return(email)
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
