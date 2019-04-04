module Carto
  module UserAuthenticator
    def authenticate(email, password)
      sanitized_input = email.strip.downcase
      if candidate = ::User.filter("email = ? OR username = ?", sanitized_input, sanitized_input).first
        login_attempt(candidate)
        return candidate if valid_password?(candidate, password)
      end
    end

    def valid_password?(candidate, password)
      Carto::EncryptionService.new.verify(password: password, secure_password: candidate.crypted_password,
                                          salt: candidate.salt)
    end

    def login_attempt(user)
      retry_after = user.password_login_attempt
      if retry_after != ::User::LOGIN_NOT_RATE_LIMITED
        throw(:warden, action: :password_locked, retry_after: retry_after)
      end
    end

    def secure_digest(*args)
      Digest::SHA1.hexdigest(args.flatten.join('--'))
    end

    def make_token
      secure_digest(Time.now, (1..10).map { rand.to_s })
    end
  end
end
