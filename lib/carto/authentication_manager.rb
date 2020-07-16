module Carto
  class AuthenticationManager

    def self.validate_session(warden_context, request, user)
      return true if session_security_token_valid?(warden_context, user)

      request.reset_session
      false
    end

    def self.session_security_token_valid?(warden_context, user)
      session = warden_context.session(user.username)

      return false unless session.key?(:sec_token)
      return true if session[:sec_token] == user.security_token

      raise Carto::ExpiredSessionError.new
    rescue Warden::NotAuthenticated
      false
    end
    private_class_method :session_security_token_valid?

  end
end