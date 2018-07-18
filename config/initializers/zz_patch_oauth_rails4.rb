# Rails 3.2.10 changed the way JSON parameters are processed, causing empty arrays be changed to nil.
# The oauth-plugin gem version 0.5.0 adds two changes:
# - Rails 4 support (that we want)
# - A filter for invalid tokens (that we don't want, since it interferes with x_auth)
#
# This patch reverts the second change

module OAuth
  module Controllers
    class Authenticator
      def allow?
        if @strategies.include?(:interactive) && interactive
          true
        elsif !(@strategies & env["oauth.strategies"].to_a).empty?
          # Patched to return always true, even if token is not present
          @controller.send :current_user=, token.user if token.present?
          true
        else
          if @strategies.include?(:interactive)
            controller.send :access_denied
          else
            controller.send :invalid_oauth_response
          end
        end
      end
    end
  end
end
