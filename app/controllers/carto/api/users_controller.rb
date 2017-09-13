module Carto
  module Api
    class UsersController < ::Api::ApplicationController
      include AppAssetsHelper
      include MapsApiHelper
      include SqlApiHelper
      include CartoDB::ConfigUtils
      include FrontendConfigHelper

      ssl_required :show, :me, :update_account, :update_profile, :get_authenticated_users

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
          is_first_time_viewing_dashboard: !(carto_viewer.dashboard_viewed_at)
        }
      end

      def update_account
        attributes = params[:user]

        password_change = (attributes[:new_password].present? || attributes[:confirm_password].present?) &&
          current_viewer.can_change_password?

        if password_change
          current_viewer.change_password(
            attributes[:old_password].presence,
            attributes[:new_password].presence,
            attributes[:confirm_password].presence
          )
        end

        if current_viewer.can_change_email? && attributes[:email].present?
          current_viewer.set_fields(attributes, [:email])
        end

        raise Sequel::ValidationFailed.new('Validation failed') unless current_viewer.valid?
        current_viewer.update_in_central
        current_viewer.save(raise_on_failure: true)

        update_session_security_token(current_viewer) if password_change

        render_jsonp(Carto::Api::UserPresenter.new(current_viewer).to_poro)
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, user: @user, params: params)
        render_jsonp({ errors: "There was a problem while updating your data. Please, try again and contact us if the problem persists" }, 400)
      rescue Sequel::ValidationFailed => e
        render_jsonp({ message: "Error updating your account details", errors: current_viewer.errors }, 400)
      end

      def update_profile
        attributes = params[:user]

        if attributes[:avatar_url].present? && valid_avatar_file?(attributes[:avatar_url])
          current_viewer.avatar_url = attributes.fetch(:avatar_url, nil)
        end

        # This fields are optional
        current_viewer.name = attributes.fetch(:name, nil)
        current_viewer.last_name = attributes.fetch(:last_name, nil)
        current_viewer.website = attributes.fetch(:website, nil)
        current_viewer.description = attributes.fetch(:description, nil)
        current_viewer.location = attributes.fetch(:location, nil)
        current_viewer.twitter_username = attributes.fetch(:twitter_username, nil)
        current_viewer.disqus_shortname = attributes.fetch(:disqus_shortname, nil)

        current_viewer.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?

        current_viewer.update_in_central
        current_viewer.save(raise_on_failure: true)

        render_jsonp(Carto::Api::UserPresenter.new(current_viewer).to_poro)
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, user: current_viewer, params: params)
        render_jsonp({ errors: "There was a problem while updating your data. Please, try again and contact us if the problem persists" }, 400)
      rescue Sequel::ValidationFailed => e
        render_jsonp({ message: "Error updating your profile details", errors: current_viewer.errors }, 400)
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

      def account_params
        params.slice(:title, :pre_html, :post_html, :type, :definition, :conf)
      end

      def profile_params
        params.slice()
      end
    end
  end
end
