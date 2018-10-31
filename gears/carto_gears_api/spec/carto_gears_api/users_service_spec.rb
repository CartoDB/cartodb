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

  context "password management" do
    before(:all) do
      @user = FactoryGirl.create(:user, password: 'my_pass', password_confirmation: 'my_pass')
    end

    after(:all) do
      @user.destroy
    end

    describe '#valid_password' do
      it 'returns true if the password is correct' do
        service.valid_password?(@user.id, 'my_pass').should be_true
      end

      it 'returns false if the password is incorrect' do
        service.valid_password?(@user.id, 'wrong').should be_false
      end
    end

    describe '#change_password' do

      context 'right parameters' do
        before(:each) do
          @user = FactoryGirl.create(:user, password: 'my_pass', password_confirmation: 'my_pass')
        end

        after(:each) do
          @user.destroy
        end

        it 'updates crypted_password' do
          expect {
            service.change_password(@user.id, 'new_password')
          }.to (change { @user.reload.crypted_password })
        end

        it 'updates last_password_change_date' do
          expect {
            service.change_password(@user.id, 'new_password')
          }.to (change { @user.reload.last_password_change_date })
        end
      end

      it 'raises a validation error if the new password is blank' do
        expect {
          service.change_password(@user.id, nil)
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /blank/)
      end

      it 'raises a validation error if the new password is too short' do
        expect {
          service.change_password(@user.id, 'a')
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /at least/)
      end

      it 'raises a validation error if the new password is too long' do
        expect {
          service.change_password(@user.id, 'a' * 70)
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /at most/)
      end

      it 'raises a validation error if the new password is the same as the old' do
        expect {
          service.change_password(@user.id, 'my_pass')
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /the same/)
      end
    end
  end
end
