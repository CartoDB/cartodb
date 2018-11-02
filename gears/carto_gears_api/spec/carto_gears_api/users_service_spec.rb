require 'spec_helper_min'
require 'carto_gears_api/users/users_service'

describe CartoGearsApi::Users::UsersService do
  let(:service) { CartoGearsApi::Users::UsersService.new }

  describe '#logged_user' do
    module CartoDB; end

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
      warden = mock
      warden.expects(:user).once.returns(user)
      request = mock
      request.expects(:env).once.returns('warden' => warden)
      CartoDB.expects(:extract_subdomain).with(request).returns(user.username)

      logged_user = service.logged_user(request)
      logged_user.email.should eq user.email
    end
  end

end
