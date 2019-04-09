module Carto
  module UserAuthenticator
    def authenticate(email, password)
      sanitized_input = email.strip.downcase
      if candidate = ::User.filter("email = ? OR username = ?", sanitized_input, sanitized_input).first
        login_attempt(candidate)
        if valid_password?(candidate, password)
          reencrypt_password(candidate, password)
          return candidate
        end
      end
    end

    def valid_password?(candidate, password)
      Carto::EncryptionService.new.verify(password: password, secure_password: candidate.crypted_password,
                                          salt: candidate.salt, secret: Cartodb.config[:password_secret])
    end

    def login_attempt(user)
      retry_after = user.password_login_attempt
      if retry_after != ::User::LOGIN_NOT_RATE_LIMITED
        throw(:warden, action: :password_locked, retry_after: retry_after)
      end
    end

    def reencrypt_password(candidate, password)
      encrypter = Carto::EncryptionService.new
      return if encrypter.argon2?(candidate.crypted_password)
      candidate.crypted_password = encrypter.encrypt(password: password, secret: Cartodb.config[:password_secret])
      candidate.salt = ""
      candidate.save
    end
  end
end
