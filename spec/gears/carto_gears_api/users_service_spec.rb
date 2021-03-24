require 'spec_helper_min'
require 'carto_gears_api/users/users_service'

describe CartoGearsApi::Users::UsersService do
  let(:service) { CartoGearsApi::Users::UsersService.new }

  context "password management" do
    before(:all) do
      @user = create(:user, password: 'my_pass', password_confirmation: 'my_pass')
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

      context 'with Google/Github sign in' do
        before(:all) do
          @user.google_sign_in = true
          @user.last_password_change_date = nil
          @user.save
        end

        after(:all) do
          @user.google_sign_in = false
          @user.save
        end

        it 'raises an error' do
          expect {
            service.valid_password?(@user.id, 'whatever')
          }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /no password/)
        end
      end
    end

    describe '#change_password' do

      context 'right parameters' do
        before(:each) do
          @user = create(:user, password: 'my_pass', password_confirmation: 'my_pass')
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

      it 'raises a validation error if the new password is the same as the username' do
        expect {
          service.change_password(@user.id, @user.username)
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /must be different than the user name/)
      end

      it 'raises a validation error if the new password is a common one' do
        expect {
          service.change_password(@user.id, 'galina')
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /can't be a common password/)
      end

      it 'raises a validation error if the new password is not strong' do
        expect {
          organization = mock
          organization.stubs(:strong_passwords_enabled).returns(true)
          User.any_instance.stubs(:organization).returns(organization)
          service.change_password(@user.id, 'galinaa')
        }.to raise_error(CartoGearsApi::Errors::ValidationFailed, /must be at least 8 characters long/)
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

      it 'raises an exception if the save operation fails' do
        User.any_instance.stubs(:save).raises(Sequel::ValidationFailed, 'Saving error')

        expect {
          service.change_password(@user.id, 'new_password')
        }.to raise_error(CartoGearsApi::Errors::SavingError)
      end

      it 'raises an exception if update_in_central operation fails' do
        User.any_instance.stubs(:update_in_central).raises(CartoDB::CentralCommunicationFailure, 'Updating error')

        expect {
          service.change_password(@user.id, 'new_password')
        }.to raise_error(CartoGearsApi::Errors::SavingError)
      end
    end
  end
end
