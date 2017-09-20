module Carto
  module Api
    class UsersController < ::Api::ApplicationController
      include OrganizationUsersHelper
      include AppAssetsHelper
      include MapsApiHelper
      include SqlApiHelper
      include CartoDB::ConfigUtils
      include FrontendConfigHelper
      include AccountTypeHelper
      include AvatarHelper

      UPDATE_ME_FIELDS = [
        :name, :last_name, :website, :description, :location, :twitter_username,
        :disqus_shortname, :available_for_hire
      ].freeze

      ssl_required :show, :me, :update_me, :get_authenticated_users

      before_filter :optional_api_authorization, only: [:me]
      skip_before_filter :api_authorization_required, only: [:me, :get_authenticated_users]

      def show
        render json: Carto::Api::UserPresenter.new(uri_user).data
      end

      def me
        carto_viewer = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil

        render json: {
          user_data: carto_viewer.present? ? Carto::Api::UserPresenter.new(carto_viewer).data : nil,
          default_fallback_basemap: carto_viewer.try(:default_basemap),
          config: frontend_config_hash,
          dashboard_notifications: carto_viewer.try(:notifications_for_category, :dashboard),
          is_just_logged_in: carto_viewer.present? ? !!flash['logged'] : nil,
          is_first_time_viewing_dashboard: !carto_viewer.try(:dashboard_viewed_at),
          user_frontend_version: carto_viewer.try(:relevant_frontend_version) || CartoDB::Application.frontend_version,
          asset_host: carto_viewer.try(:asset_host),
          can_change_email: carto_viewer.present? ? carto_viewer.can_change_email? : nil,
          auth_username_password_enabled: carto_viewer.try(:organization) && carto_viewer.try(:organization, :auth_username_password_enabled),
          should_display_old_password: carto_viewer.present? ? carto_viewer.should_display_old_password? : nil,
          can_change_password: carto_viewer.present? ? carto_viewer.can_change_password? : nil,
          plan_name: carto_viewer.present? ? plan_name(carto_viewer.account_type) : nil,
          plan_url: carto_viewer.present? ? carto_viewer.plan_url(request.protocol) : nil,
          cant_be_deleted_reason: carto_viewer.present? ? can_be_deleted?(carto_viewer) : nil,
          services: carto_viewer.present? ? @services : []
        }
      end

      def update_me
        user = current_viewer

        attributes = params[:user]
        return(head 403) unless attributes.present?

        update_password_if_needed(user, attributes)

        if user.can_change_email? && attributes[:email].present?
          user.set_fields(attributes, [:email])
        end

        if attributes[:avatar_url].present? && valid_avatar_file?(attributes[:avatar_url])
          user.set_fields(attributes, [:avatar_url])
        end

        fields_to_be_updated = UPDATE_ME_FIELDS.select { |field| attributes.has_key?(field) }

        user.set_fields(attributes, fields_to_be_updated) if fields_to_be_updated.present?

        raise Sequel::ValidationFailed.new('Validation failed') unless user.valid?
        user.update_in_central
        user.save(raise_on_failure: true)

        render_jsonp(Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_poro)
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, user: user, params: params)
        render_jsonp({ errors: "There was a problem while updating your data. Please, try again." }, 422)
      rescue Sequel::ValidationFailed
        render_jsonp({ message: "Error updating your account details", errors: user.errors }, 400)
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

      def can_be_deleted?(user)
        if user.organization_owner?
          return "You can't delete your account because you are admin of an organization"
        elsif Carto::UserCreation.http_authentication.where(user_id: user.id).first.present?
          return "You can't delete your account because you are using HTTP Header Authentication"
        else
          return nil
        end
      end

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

      def update_password_if_needed(user, attributes)
        password_change = (attributes[:new_password].present? || attributes[:confirm_password].present?) &&
                          user.can_change_password?

        if password_change
          user.change_password(
            attributes[:old_password],
            attributes[:new_password],
            attributes[:confirm_password]
          )

          update_session_security_token(user)
        end
      end
    end
  end
end
