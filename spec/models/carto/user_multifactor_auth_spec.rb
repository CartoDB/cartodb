# encoding: utf-8

require 'spec_helper'

describe Carto::UserMultifactorAuth do

  before :all do
    @valid_type = 'totp'
  end

  before :each do
    @carto_user = FactoryGirl.create(:carto_user)
  end

  after :each do
    @carto_user.destroy
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
  end

  describe '#save' do
    before :each do
      @multifactor_auth = FactoryGirl.create(:totp, user: @carto_user)
    end

    after :each do
      @multifactor_auth.destroy
    end

    it 'does not allow updating the shared_scret field' do
      @multifactor_auth.shared_secret = 'wadus'
      expect {
        @multifactor_auth.save!
      }.to raise_error(/Change of shared_secret not allowed!/)
    end
  end

  describe '#verify' do
    it 'verifies a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      expect { mfa.verify(mfa.totp.now) }.to be
    end

    it 'does not allow reuse of a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      code = mfa.totp.now
      expect { mfa.verify(code) }.to be
      Delorean.jump((Carto::UserMultifactorAuth::DRIFT * 2).seconds)
      mfa.verify(code).should_not be
    end

    it 'does not verify an invalid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      totp = ROTP::TOTP.new(ROTP::Base32.random_base32)
      mfa.verify(totp.now).should_not be
    end
  end

  describe '#verify!' do
    it 'verifies a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      code = mfa.totp.now
      mfa.verify!(code)
      expect { mfa.enabled }.to be_true
    end

    it 'does not allow reuse of a valid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      code = mfa.totp.now
      mfa.verify!(code)
      expect { mfa.verify!(code) }.to raise_error("The code is not valid")
    end

    it 'does not verify an invalid code' do
      mfa = Carto::UserMultifactorAuth.create!(user_id: @carto_user.id, type: @valid_type)
      totp = ROTP::TOTP.new(ROTP::Base32.random_base32)
      expect { mfa.verify!(totp.now) }.to raise_error("The code is not valid")
    end
  end

  describe '#provisioning_uri' do
    before :each do
      @multifactor_auth = FactoryGirl.create(:totp, user: @carto_user)
    end

    after :each do
      @multifactor_auth.destroy
    end

    it 'provides a provisioning_uri' do
      uri = "otpauth://totp/CARTO:#{@carto_user.username}?secret=#{@multifactor_auth.shared_secret}&issuer=CARTO"
      @multifactor_auth.provisioning_uri.should eq uri
    end
  end
end
