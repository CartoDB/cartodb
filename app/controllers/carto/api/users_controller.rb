module Carto
  module Api
    class UsersController < ::Api::ApplicationController
      include AppAssetsHelper
      include MapsApiHelper
      include SqlApiHelper
      include CartoDB::ConfigUtils
      include FrontendConfigHelper
      include AccountTypeHelper

      ssl_required :show, :me, :get_authenticated_users

      skip_before_filter :api_authorization_required, only: [:get_authenticated_users]

      def show
        render json: Carto::Api::UserPresenter.new(uri_user).data
      end

      def me
        carto_viewer = Carto::User.find(current_viewer.id)

        render json: {
          user_data: Carto::Api::UserPresenter.new(carto_viewer).data,
          default_fallback_basemap: carto_viewer.default_basemap,
          config: frontend_config_hash,
          dashboard_notifications: carto_viewer.notifications_for_category(:dashboard),
          is_just_logged_in: !!flash['logged'],
          is_first_time_viewing_dashboard: !(carto_viewer.dashboard_viewed_at),
          can_change_email: carto_viewer.can_change_email?,
          auth_username_password_enabled: carto_viewer.organization && carto_viewer.organization.auth_username_password_enabled,
          should_display_old_password: carto_viewer.should_display_old_password?,
          can_change_password: carto_viewer.can_change_password?,
          plan_name: plan_name(carto_viewer.account_type),
          plan_url: carto_viewer.plan_url(request.protocol),
          can_be_deleted: @can_be_deleted,
          cant_be_deleted_reason: @cant_be_deleted_reason,
          services: @services
        }
      end

      def get_authenticated_users
        referer = request.env["HTTP_ORIGIN"].blank? ? request.env["HTTP_REFERER"] : %[#{request.env['HTTP_X_FORWARDED_PROTO']}://#{request.env["HTTP_HOST"]}]
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
          name: user.name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          email: user.email,
          organization: Carto::Api::OrganizationPresenter.new(user.organization).to_poro,
          base_url: user.public_url
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
