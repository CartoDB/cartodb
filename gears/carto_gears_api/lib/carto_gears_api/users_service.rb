require 'values'
require 'uuidtools'

module CartoGearsApi
  # User information.
  #
  # @attr_reader [UUID] id User id
  # @attr_reader [String] username User name
  # @attr_reader [String] email Email
  # @attr_reader [CartoGearsApi::Organization] organization Organization
  class User < Value.new(:id, :username, :email, :organization)
    extend ActiveModel::Naming
    include ActiveRecord::AttributeMethods::PrimaryKey

    def id
      # This is needed to make ActiveRecord::AttributeMethods::PrimaryKey work. Otherwise it
      # won't find the id accessible thanks to Value. Magic is not always compatible.
      @id
    end

    # @return [String] The subdomain required by this user in the current CARTO configuration.
    #                  It takes into account subdomainless URLs and organizations.
    def subdomain
      if CartoDB.subdomainless_urls?
        username
      else
        organization.nil? ? username : organization.name
      end
    end
  end

  # Organization information.
  #
  # @attr_reader [String] name Organization name.
  class Organization < Value.new(:name); end

  class UsersService
    # Returns the logged user at the request.
    #
    # @param request [ActionDispatch::Request] CARTO request, as received in any controller.
    # @return [CartoGearsApi::User] the user.
    def logged_user(request)
      user(request.env['warden'].user(CartoDB.extract_subdomain(request)))
    end

    private

    def user(user)
      CartoGearsApi::User.with(
        id: UUIDTools::UUID.parse(user.id),
        username: user.username,
        email: user.email,
        organization: user.organization ? organization(user.organization) : nil
      )
    end

    def organization(organization)
      CartoGearsApi::Organization.with(name: organization.name)
    end
  end
end
