require 'spec_helper_min'
require 'carto/user_authenticator'
require 'cartodb-common'

describe Carto::UserAuthenticator do
  include Carto::UserAuthenticator

  before(:all) do
    @user_password = 'admin123'
    @user = create(:carto_user, password: @user_password)
  end

  after(:all) do
    @user.delete
  end

  it "should authenticate if given email and password are correct" do
    response_user = authenticate(@user.email, @user_password)
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    authenticate(@user.email, @user_password + 'no').should be_nil
    authenticate('', '').should be_nil
  end

  it "should authenticate with case-insensitive email and username" do
    response_user = authenticate(@user.email, @user_password)
    response_user.id.should eq @user.id
    response_user.email.should eq @user.email

    response_user2 = authenticate(@user.email.upcase, @user_password)
    response_user2.id.should eq @user.id
    response_user2.email.should eq @user.email

    response_user3 = authenticate(@user.username, @user_password)
    response_user3.id.should eq @user.id
    response_user3.email.should eq @user.email

    response_user4 = authenticate(@user.username.upcase, @user_password)
    response_user4.id.should eq @user.id
    response_user4.email.should eq @user.email
  end

  context "password reencryption" do
    after(:each) do
      @user.crypted_password = Carto::Common::EncryptionService.encrypt(password: @user_password,
                                                                        secret: Cartodb.config[:password_secret])
      @user.save
    end

    it "reencrypts the password if it is correct and not saved with argon2" do
      ::User.any_instance.stubs(:update_in_central).returns(true)
      @user.crypted_password = Carto::Common::EncryptionService.encrypt(password: @user_password,
                                                                        sha_class: Digest::SHA1)
      @user.save
      @user.crypted_password.length.should eql 40

      authenticate(@user.email, @user_password)

      @user.reload.crypted_password.should =~ /^\$argon2/
    end

    it "does not reencrypt the password if the password is not correct" do
      @user.crypted_password = Carto::Common::EncryptionService.encrypt(password: @user_password,
                                                                        sha_class: Digest::SHA1)
      @user.save
      initial_crypted_password = @user.crypted_password
      initial_crypted_password.length.should eql 40

      authenticate(@user.email, "wrong pass")

      @user.reload.crypted_password.should eql initial_crypted_password
    end

    it "does not reencrypt the password if it was already with argon2" do
      initial_crypted_password = @user.crypted_password
      initial_crypted_password.should =~ /^\$argon2/

      authenticate(@user.email, @user_password)

      @user.reload.crypted_password.should eql initial_crypted_password
    end
  end
end
