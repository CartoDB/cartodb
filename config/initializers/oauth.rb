module OAuth
  module Controllers
    module ApplicationControllerMethods
      class Authenticator
        def oauth10_request_token_with_xauth
          if params[:x_auth_mode] == 'client_auth'
            # xAuth authentication
            two_legged
          else
            # OAuth authentication
            oauth10_request_token_without_xauth
          end
        end

        alias_method_chain :oauth10_request_token, :xauth
      end
    end
  end
end
