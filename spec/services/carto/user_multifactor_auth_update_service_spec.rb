require 'spec_helper_min'

describe Carto::UserMultifactorAuthUpdateService do

  before(:all) do
    @user = create(:carto_user)
    @service = Carto::UserMultifactorAuthUpdateService.new(user_id: @user.id)
  end

  after(:all) do
    @user.destroy
  end

  describe '#update' do
    after(:each) do
      @user.user_multifactor_auths.each(&:destroy)
    end

    context 'with enabled = true' do
      it 'creates a totp multifactor auth for the user' do
        expect { @service.update(enabled: true) }.to change { @user.user_multifactor_auths.count }.by(1)
        @user.user_multifactor_auths.first.type.should eql 'totp'
      end

      it 'does nothing if the user already has one multifactor auth' do
        @service.update(enabled: true)
        expect { @service.update(enabled: true) }.to change { @user.user_multifactor_auths.count }.by(0)
      end
    end

    context 'with enabled = false' do
      it 'removes all the multifactor auths of the user' do
        @service.update(enabled: true)
        @user.reload.user_multifactor_auths.should_not be_empty

        @service.update(enabled: false)

        @user.reload.user_multifactor_auths.should be_empty
      end

      it 'does nothing if the user does not have multifactor auths' do
        expect { @service.update(enabled: false) }.to change { @user.user_multifactor_auths.count }.by(0)
      end
    end
  end

end
