require 'values'

module CartoGearsApi
  class UsersService
    def logged_user(request)
      user(request.env['warden'].user(CartoDB.extract_subdomain(request)))
    end

    private

    def user(user_model)
      Value.new(:email).with(email: user_model.email)
    end
  end
end
