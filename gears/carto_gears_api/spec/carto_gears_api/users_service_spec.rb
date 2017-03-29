require 'spec_helper'
require 'carto_gears_api/users/users_service'

describe CartoGearsApi::Users::UsersService do
  describe '#logged_user' do
    module CartoDB; end

    let(:service) { CartoGearsApi::Users::UsersService.new }

    # This test is 100% bound to implementation. It's mostly a PoC for unit testing
    # within Gears and should not be used as an example.
    it 'returns the logged user based on subdomain and warden' do
      user = CartoGearsApi::Users::User.with(
        id: 'b51e56fb-f3c9-463f-b950-d9be188551e5',
        username: 'wadus_username',
        email: 'wadus@carto.com',
        organization: nil,
        feature_flags: [],
        can_change_email: true,
        quota_in_bytes: 100000,
        viewer: false
      )
      warden = double
      warden.should_receive(:user).once.and_return(user)
      request = double
      request.should_receive(:env).once.and_return('warden' => warden)
      CartoDB.should_receive(:extract_subdomain).with(request).and_return(user.username)

      logged_user = service.logged_user(request)
      logged_user.email.should eq user.email
    end
  end
end
