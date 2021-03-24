require 'spec_helper_unit'

describe Carto::UserMultifactorAuth do

  def totp_code(mfa)
    ROTP::TOTP.new(mfa.shared_secret).now
  end

  before do
    @valid_type = 'totp'
    @carto_user = create(:carto_user)
    Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(false)
    @carto_user.reload.user_multifactor_auths.each(&:destroy!)
  end

  describe '#create' do
    it 'does not validate an unsupported multi-factor authentication type' do
      mfa = Carto::UserMultifactorAuth.new(user_id: @carto_user.id, type: 'wadus')
      mfa.valid?.should eq(false)
    end

    it 'validates supported multi-factor authentication types' do
      mfa = Carto::UserMultifactorAuth.new(user_id: @carto_user.id, type: @valid_type)
      expect { mfa.valid? }.to be_true
    end

    it 'creates a new multifactor auth for a user' do
      expect {
        Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      }.to_not raise_error
    end

    it 'populates shared_secret' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      expect { mfa.shared_secret }.to_not be_nil
    end

    it 'is disabled by default' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      expect { mfa.disabled? }.to be_true
    end

    it 'syncs to central' do
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(true)
      Cartodb::Central
        .any_instance
        .expects(:update_user)
        .with(@carto_user.username,
              has_entries(multifactor_authentication_status: User::MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP))
        .once
      Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
    end
  end

  describe '#update' do
    it 'syncs enabled to central' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(true)

      Cartodb::Central
        .any_instance
        .expects(:update_user)
        .with(@carto_user.username,
              has_entries(multifactor_authentication_status: User::MULTIFACTOR_AUTHENTICATION_ENABLED))
        .once

      mfa.enabled = true
      mfa.save!
    end

    it 'syncs needs setup to central' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type, enabled: true)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(true)

      Cartodb::Central
        .any_instance
        .expects(:update_user)
        .with(@carto_user.username,
              has_entries(multifactor_authentication_status: User::MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP))
        .once

      mfa.enabled = false
      mfa.save!
    end

    it 'syncs disabled to central' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      Cartodb::Central.stubs(:message_broker_sync_enabled?).returns(true)

      Cartodb::Central
        .any_instance
        .expects(:update_user)
        .with(@carto_user.username,
              has_entries(multifactor_authentication_status: User::MULTIFACTOR_AUTHENTICATION_DISABLED))
        .once

      mfa.destroy!
    end
  end

  describe '#verify!' do
    it 'verifies a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      code = totp_code(mfa)
      mfa.verify!(code)
      expect { mfa.enabled }.to be_true
    end

    it 'does not allow reuse of a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      code = totp_code(mfa)
      mfa.verify!(code)
      expect { mfa.verify!(code) }.to raise_error("The code is not valid")
    end

    it 'does not verify an invalid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      totp = ROTP::TOTP.new(ROTP::Base32.random_base32)
      expect { mfa.verify!(totp.now) }.to raise_error("The code is not valid")
    end

    it 'does not allow use of future/past tokens' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      totp = ROTP::TOTP.new(mfa.shared_secret)
      expect { mfa.verify!(totp.at(Time.now - 90.seconds)) }.to raise_error("The code is not valid")
    end

    it 'verifies a code taking into account 30 seconds drift' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      totp = ROTP::TOTP.new(mfa.shared_secret)
      expect { mfa.verify!(totp.at(Time.now - 30.seconds)) }.to be_true
    end
  end

  describe '#provisioning_uri' do
    before do
      @multifactor_auth = create(:totp, :active, user: @carto_user)
    end

    it 'provides a provisioning_uri' do
      uri = "otpauth://totp/CARTO:#{@carto_user.username}?secret=#{@multifactor_auth.shared_secret}&issuer=CARTO"
      @multifactor_auth.provisioning_uri.should eq uri
    end
  end
end
