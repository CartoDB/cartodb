require 'values'

module CartoGearsApi
  # User information.
  #
  # @attr_reader [String]        email     Email
  class User < Value.new(:email); end

  class UsersService
    # Returns the logged user at the request.
    #
    # @param request [ActionDispatch::Request] CARTO request, as received in any controller.
    # @return [CartoGearsApi::User] the user.
    def logged_user(request)
      user(request.env['warden'].user(CartoDB.extract_subdomain(request)))
    end

    private

    def user(user_model)
      CartoGearsApi::User.with(email: user_model.email)
    end
  end
end
