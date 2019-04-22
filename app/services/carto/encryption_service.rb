require 'securerandom'

module Carto
  class EncryptionService

    DEFAULT_TOKEN_LENGTH = 40

    DEFAULT_AUTH_DIGEST_KEYS = {
      Digest::SHA1 => '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3',
      Digest::SHA256 => '1211b3e77138f6e1724721f1ab740c9c70e66ba6fec5e989bb6640c4541ed15d06dbd5fdcbd3052b'
    }.freeze

    DEFAULT_SHA_CLASS = Digest::SHA1

    def encrypt(password:, sha_class: nil, salt: nil, secret: nil)
      return encrypt_sha(sha_class: sha_class, args: [salt, password]) if sha_class
      encrypt_argon2(password, secret) unless sha_class
    end

    def verify(password:, secure_password:, salt: nil, secret: nil)
      return verify_argon2(password, secure_password, secret) if argon2?(secure_password)
      verify_sha(password, secure_password, salt)
    end

    def make_token(length: DEFAULT_TOKEN_LENGTH)
      SecureRandom.hex(length / 2)
    end

    def argon2?(encryption)
      encryption =~ /^\$argon2/
    end

    def hex_digest(encryption)
      return encrypt_sha(args: [encryption]) if argon2?(encryption)
      encryption
    end

    private

    def encrypt_argon2(password, secret)
      argon2 = Argon2::Password.new(secret: secret)
      argon2.create(password)
    end

    def verify_argon2(password, secure_password, secret)
      Argon2::Password.verify_password(password, secure_password, secret)
    end

    def encrypt_sha(sha_class: DEFAULT_SHA_CLASS, initial_digest: nil, digest_key: nil, args: [])
      digest_key ||= DEFAULT_AUTH_DIGEST_KEYS[sha_class]
      digest = initial_digest || digest_key
      args_join = '--' if sha_class == Digest::SHA1

      10.times do
        joined_args = [digest, args, digest_key].flatten.join(args_join)
        digest = sha_class.hexdigest(joined_args)
      end
      digest
    end

    def verify_sha(password, secure_password, salt)
      case secure_password
      when /^\h{40}$/ then secure_password == encrypt_sha(sha_class: Digest::SHA1, args: [salt, password])
      when /^\h{64}$/ then secure_password == encrypt_sha(sha_class: Digest::SHA256, args: [salt, password])
      else false
      end
    end

  end
end
