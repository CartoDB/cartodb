module Carto
  module Api
    class UsersController < ::Api::ApplicationController

      ssl_required :get_authenticated_users, :show

      skip_before_filter :api_authorization_required, only: [:get_authenticated_users]
      
      def show
        render json: Carto::Api::UserPresenter.new(uri_user).data
      end

      def get_authenticated_users
        referer = request.env["HTTP_REFERER"]
        referer_match = /https?:\/\/([\w\-\.]+)(:[\d]+)?(\/((u|user)\/([\w\-\.]+)))?/.match(referer)
        if referer_match.nil?
          render json: { error: "Referer #{referer} does not match" }, status: 400 and return
        end

        if session_user.nil?
          render json: {
                         urls: [],
                         username: nil,
                         avatar_url: nil
                       } and return
        end

        subdomain = referer_match[1].gsub(CartoDB.session_domain, '').downcase
        # referer_match[6] is the username
        referer_organization_username = referer_match[6]
        render_auth_users_data(session_user, referer, subdomain, referer_organization_username)
      end

      private

      def render_auth_users_data(user, referrer, subdomain, referrer_organization_username=nil)
        organization_name = nil

        # It doesn't have a organization username component. We assume it's not a organization referer
        if referrer_organization_username.nil?
          # The user is authenticated but seeing another user dashboard
          if user.username != subdomain
            organization_name = CartoDB::UserOrganization.user_belongs_to_organization?(user.username)
          end
        else
          referrer_organization_username = referrer_organization_username.downcase

          # The user is seeing its own organization dashboard
          if user.username == referrer_organization_username
            organization_name = subdomain
          # The user is seeing a organization dashboard, but not its one
          else
            # Authenticated with a user of the organization
            if user.organization && user.organization.name == subdomain
              organization_name = subdomain
            # The user is authenticated with a user not belonging to the requested organization dashboard
            # Let's get the first user in the session
            else
              organization_name = CartoDB::UserOrganization.user_belongs_to_organization?(user.username)
            end
          end
        end

        render json: {
          urls: ["#{CartoDB.base_url(user.username, organization_name)}#{CartoDB.path(self, 'dashboard_bis')}"],
          username: user.username,
          name: user.name_or_username,
          avatar_url: user.avatar_url,
          email: user.email,
          organization: Carto::Api::OrganizationPresenter.new(user.organization).to_poro,
          base_url: user.public_url,
          feature_flags: user.feature_flag_names
        }
      end

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_user
      # URI present-user if has valid session, or nil
      def uri_user
        @uri_user ||= (current_user.nil? ? nil : Carto::User.where(id: current_user.id).first)
      end

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_viewer
      # 1st user that has valid session, if coincides with URI then same as uri_user
      def session_user
        @session_user ||= (current_viewer.nil? ? nil : Carto::User.where(id: current_viewer.id).first)
      end

    end
  end
end
