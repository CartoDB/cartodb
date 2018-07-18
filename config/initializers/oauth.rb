module OAuth
  module Controllers
    module ApplicationControllerMethods
      class Authenticator
        def oauth10_request_token_with_xauth
          if controller.params[:x_auth_mode] == 'client_auth'
            # xAuth authentication
            two_legged
          else
            # OAuth authentication
            oauth10_request_token_without_xauth
          end
        end

        alias_method_chain :oauth10_request_token, :xauth

        # Rails 3.2.10 changed the way JSON parameters are processed, causing empty arrays be changed to nil.
        # The oauth-plugin gem version 0.5.0 adds two changes:
        # - Rails 4 support (that we want)
        # - A filter for invalid tokens (that we don't want, since it interferes with x_auth)
        #
        # This patch reverts the second change

        # From 0.4.0.pre4
        def allow?
          if @strategies.any? do |strategy|
              @strategy  = strategy.to_sym
              byebug
              send @strategy
            end
            true
          else
            if @strategies.include?(:interactive)
              controller.send :access_denied
            else
              controller.send :invalid_oauth_response
            end
          end
        end

        # From 0.4.0.pre4
        def two_legged
          if ClientApplication.verify_request(request) do |request_proxy|
              @client_application = ClientApplication.find_by_key(request_proxy.consumer_key)

              # Store this temporarily in client_application object for use in request token generation
              @client_application.token_callback_url=request_proxy.oauth_callback if request_proxy.oauth_callback

              # return the token secret and the consumer secret
              [nil, @client_application.secret]
            end
            controller.send :current_client_application=, @client_application
            true
          else
            false
          end
        rescue
          false
        end
      end
    end
  end
end
