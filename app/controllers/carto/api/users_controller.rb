require_dependency 'google_plus_api'
require_dependency 'google_plus_config'
require_relative '../../helpers/avatar_helper'

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
        :disqus_shortname, :available_for_hire, :company, :industry, :phone, :job_role
      ].freeze

      PASSWORD_DOES_NOT_MATCH_MESSAGE = 'Password does not match'.freeze

      ssl_required :show, :me, :update_me, :delete_me, :get_authenticated_users

      before_filter :initialize_google_plus_config, only: [:me]
      before_filter :optional_api_authorization, only: [:me]
      skip_before_filter :api_authorization_required, only: [:me, :get_authenticated_users]

      def show
        render json: Carto::Api::UserPresenter.new(uri_user).data
      end

      def me
        carto_viewer = current_viewer.present? ? Carto::User.find(current_viewer.id) : nil

        cant_be_deleted_reason = carto_viewer.try(:cant_be_deleted_reason)
        can_be_deleted = carto_viewer.present? ? cant_be_deleted_reason.nil? : nil

        render json: {
          user_data: carto_viewer.present? ? Carto::Api::UserPresenter.new(carto_viewer).data : nil,
          default_fallback_basemap: carto_viewer.try(:default_basemap),
          config: frontend_config_hash(current_viewer),
          dashboard_notifications: carto_viewer.try(:notifications_for_category, :dashboard),
          is_just_logged_in: carto_viewer.present? ? !!flash['logged'] : nil,
          is_first_time_viewing_dashboard: !carto_viewer.try(:dashboard_viewed_at),
          can_change_email: carto_viewer.try(:can_change_email?),
          auth_username_password_enabled: carto_viewer.try(:organization).try(:auth_username_password_enabled),
          should_display_old_password: carto_viewer.try(:should_display_old_password?),
          can_change_password: carto_viewer.try(:can_change_password?),
          plan_name: carto_viewer.present? ? plan_name(carto_viewer.account_type) : nil,
          plan_url: carto_viewer.try(:plan_url, request.protocol),
          can_be_deleted: can_be_deleted,
          cant_be_deleted_reason: cant_be_deleted_reason,
          services: carto_viewer.try(:get_oauth_services),
          user_frontend_version: carto_viewer.try(:relevant_frontend_version) || CartoDB::Application.frontend_version,
          asset_host: carto_viewer.try(:asset_host),
          google_sign_in: carto_viewer.try(:google_sign_in),
          google_plus_iframe_src: carto_viewer.present? ? google_plus_iframe_src : nil,
          google_plus_client_id: carto_viewer.present? ? google_plus_client_id : nil
        }
      end

      def update_me
        user = current_viewer

        attributes = params[:user]

        if attributes.present?
          unless password_change?(user, attributes) ||
                 user.valid_password_confirmation(attributes[:password_confirmation])
            raise Carto::PasswordConfirmationError.new
          end

          update_password_if_needed(user, attributes)

          if user.can_change_email? && attributes[:email].present?
            user.set_fields(attributes, [:email])
          end

          if attributes[:avatar_url].present? && valid_avatar_file?(attributes[:avatar_url])
            user.set_fields(attributes, [:avatar_url])
          end

          fields_to_be_updated = UPDATE_ME_FIELDS.select { |field| attributes.has_key?(field) }

          user.set_fields(attributes, fields_to_be_updated) if fields_to_be_updated.present?

          raise Sequel::ValidationFailed.new('Validation failed') unless user.errors.try(:empty?) && user.valid?
          user.update_in_central
          user.save(raise_on_failure: true)
        end

        render_jsonp(Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_poro)
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, user: user, params: params)
        render_jsonp({ errors: "There was a problem while updating your data. Please, try again." }, 422)
      rescue Sequel::ValidationFailed
        render_jsonp({ message: "Error updating your account details", errors: user.errors }, 400)
      rescue Carto::PasswordConfirmationError
        render_jsonp({ message: "Error updating your account details", errors: user.errors }, 403)
      end

      def delete_me
        user = current_viewer

        deletion_password_confirmation = params[:deletion_password_confirmation]

        if user.needs_password_confirmation? && !user.validate_old_password(deletion_password_confirmation)
          render_jsonp({ message: "Error deleting user: #{PASSWORD_DOES_NOT_MATCH_MESSAGE}" }, 400) and return
        end

        user.destroy_account

        render_jsonp({ logout_url: logout_url }, 200)
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, message: 'Central error deleting user at CartoDB', user: @user)
        render_jsonp({ errors: "Error deleting user: #{e.user_message}" }, 422)
      rescue => e
        CartoDB.notify_exception(e, user: user.inspect)
        render_jsonp({ message: "Error deleting user: #{e.message}", errors: user.errors }, 400)
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

      def google_plus_iframe_src
        @google_plus_config.present? ? @google_plus_config.iframe_src : nil
      end

      def google_plus_client_id
        @google_plus_config.present? ? @google_plus_config.client_id : nil
      end

      def initialize_google_plus_config
        signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
        @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action)
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
        if password_change?(user, attributes)
          user.change_password(
            attributes[:old_password],
            attributes[:new_password],
            attributes[:confirm_password]
          )

          update_session_security_token(user)
        end
      end

      def password_change?(user, attributes)
        (attributes[:new_password].present? || attributes[:confirm_password].present?) && user.can_change_password?
      end
    end
  end
end
