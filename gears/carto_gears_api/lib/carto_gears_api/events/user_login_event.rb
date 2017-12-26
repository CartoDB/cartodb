module CartoGearsApi
  module Events
    # Event triggered when a user performs a login in the box.
    # This is not triggered if you use an external authentication system
    # that overrides local authentication.
    # For example, this won't work in a SaaS with a central authentication system.
    # Nevertheless, it will always work for organization login.
    # LDAP, SAML and other authentication systems will work, because they use
    # local authentication system.
    class UserLoginEvent < BaseEvent
      def initialize(user)
        @first_login = user.dashboard_viewed_at.nil?
        @user = Users::User.from_model(user)
      end

      attr_reader :user

      def first_login?
        @first_login
      end
    end
  end
end
