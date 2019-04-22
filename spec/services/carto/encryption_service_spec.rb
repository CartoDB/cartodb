require 'spec_helper_min'

describe Carto::EncryptionService do

  before(:all) do
    @service = Carto::EncryptionService.new
    @password = "location"
    @user = FactoryGirl.create(:carto_user, password: @password, password_confirmation: @password)
    @salt = "98dffcb748fc487987af5774ec3aab2d106e8578"
    # "location" encrypted with different methods
    @argon2 = "$argon2id$v=19$m=65536,t=2,p=1$slA4QxnG7HRZoU8h0om3wQ$uHSuZsbyIX0ZHe01lsFn/NgBdlroxJUKjdiasKoZSZU"
    @sha1 = "e4c2a6d7d41e6170470a9d1d3234bdcbc1b95018"
    @sha256 = "c419d4097e20c71e76f09a5640cd095aba019198c34439b71e63146f15de7c34"
  end

  after(:all) do
    @user.destroy
  end

  describe "#encrypt" do
    it "uses Argon2 by default" do
      result = @service.encrypt(password: "wadus")
      result.should match /^\$argon2/
      result.length.should eql 97
    end

    it "returns a different output each time" do
      result1 = @service.encrypt(password: "wadus")
      result2 = @service.encrypt(password: "wadus")
      result1.should_not eql result2
    end

    it "allows to use SHA1" do
      result = @service.encrypt(password: "wadus", sha_class: Digest::SHA1, salt: "himalayan")
      result.should match /\h{40}$/
    end

    it "allows to use SHA256" do
      result = @service.encrypt(password: "wadus", sha_class: Digest::SHA256, salt: "himalayan")
      result.should match /\h{64}$/
    end
  end

  describe "#verify" do
    context "with Argon2" do
      it "returns true if the encryption matches" do
        result = @service.verify(password: @password, secure_password: @argon2)
        result.should be_true
      end

      it "returns false if the encryption does not match" do
        result = @service.verify(password: "other", secure_password: @argon2)
        result.should be_false
      end

      it "returns false if there is no password" do
        result = @service.verify(password: nil, secure_password: @argon2)
        result.should be_false
      end

      it "returns false if there is no encrypted password" do
        result = @service.verify(password: @password, secure_password: nil)
        result.should be_false
      end

      it "verifies passwords encrypted by the service" do
        encrypted = @service.encrypt(password: "wadus")
        result = @service.verify(password: "wadus", secure_password: encrypted)
        result.should be_true
      end

      it "verifies passwords encrypted by the service with a secret" do
        encrypted = @service.encrypt(password: "wadus", secret: "women")
        result = @service.verify(password: "wadus", secure_password: encrypted, secret: "women")
        result.should be_true
      end

      it "returns false if the secret is wrong" do
        encrypted = @service.encrypt(password: "wadus", secret: "women")
        result = @service.verify(password: "wadus", secure_password: encrypted, secret: "men")
        result.should be_false
      end

      it "verifies user passwords" do
        result = @service.verify(password: @password, secure_password: @user.crypted_password, salt: @user.salt,
                                 secret: Cartodb.config[:password_secret])
        result.should be_true
      end

      it "verifies visualization passwords" do
        visualization = FactoryGirl.create(:carto_visualization, type: Carto::Visualization::TYPE_DERIVED, user: @user)
        visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
        visualization.password = @password
        visualization.save!

        result = @service.verify(password: @password, secure_password: visualization.encrypted_password,
                                 salt: visualization.password_salt, secret: Cartodb.config[:password_secret])
        result.should be_true
      end
    end

    context "with SHA1" do
      it "returns true if the encryption matches" do
        result = @service.verify(password: @password, secure_password: @sha1, salt: @salt)
        result.should be_true
      end

      it "returns false if the encryption does not match" do
        result = @service.verify(password: "other", secure_password: @sha1, salt: @salt)
        result.should be_false
      end

      it "verifies passwords encrypted by the service" do
        encrypted = @service.encrypt(password: "wadus", sha_class: Digest::SHA1, salt: "himalayan")
        result = @service.verify(password: "wadus", secure_password: encrypted, salt: "himalayan")
        result.should be_true
      end
    end

    context "with SHA256" do
      it "returns true if the encryption matches" do
        result = @service.verify(password: @password, secure_password: @sha256, salt: @salt)
        result.should be_true
      end

      it "returns false if the encryption does not match" do
        result = @service.verify(password: "other", secure_password: @sha256, salt: @salt)
        result.should be_false
      end

      it "verifies passwords encrypted by the service" do
        encrypted = @service.encrypt(password: "wadus", sha_class: Digest::SHA1, salt: "himalayan")
        result = @service.verify(password: "wadus", secure_password: encrypted, salt: "himalayan")
        result.should be_true
      end
    end
  end

  describe "#make_token" do
    it "creates a random token with 40 characters by default" do
      result = @service.make_token
      result.length.should eql 40
    end

    it "returns a different output each time" do
      result1 = @service.make_token
      result2 = @service.make_token
      result1.should_not eql result2
    end

    it "creates a random token with custom length" do
      result = @service.make_token(length: 64)
      result.length.should eql 64
    end
  end

  describe "#hex_digest" do
    it "returns the same value for SHA1 passwords" do
      @service.hex_digest(@sha1).should eql @sha1
    end

    it "returns the same value for SHA256 passwords" do
      @service.hex_digest(@sha256).should eql @sha256
    end

    it "returns a SHA1 hash for Argon2 passwords" do
      @service.hex_digest(@argon2).should eql "f6b9551f0c30c1caa6837ec482729e569bff0cee"
    end
  end
end
