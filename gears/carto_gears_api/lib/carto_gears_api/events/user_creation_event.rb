module CartoGearsApi
  module Events
    # Event triggered when a user is created
    # @attr_reader [String] created_via source of the user creation. One of the +CREATED_VIA_*+ constants
    # @attr_reader [Users::User] user user which was created
    class UserCreationEvent < BaseEvent
      # User created via login in with SAML SSO
      CREATED_VIA_SAML = Carto::UserCreation::CREATED_VIA_SAML
      # User created via login with LDAP credentials
      CREATED_VIA_LDAP = Carto::UserCreation::CREATED_VIA_LDAP
      # User created via signup up to the org
      CREATED_VIA_ORG_SIGNUP = Carto::UserCreation::CREATED_VIA_ORG_SIGNUP
      # User created via enterprise user management API (EUMAPI)
      CREATED_VIA_API = Carto::UserCreation::CREATED_VIA_API
      # User created via HTTP header authentication
      CREATED_VIA_HTTP_AUTENTICATION = Carto::UserCreation::CREATED_VIA_HTTP_AUTENTICATION
      # User created by organization administrator
      CREATED_VIA_ORG_ADMIN = 'org_admin'.freeze
      # User created by superadmin
      CREATED_VIA_SUPERADMIN = 'superadmin'.freeze

      attr_reader :user, :created_via

      # @api private
      def initialize(created_via, user)
        @created_via = created_via
        @user = Users::User.from_model(user)
      end
    end
  end
end
