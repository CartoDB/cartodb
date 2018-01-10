# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationUsersController < ::Api::ApplicationController
      include OrganizationUsersHelper

      ssl_required :index, :show, :create, :update, :destroy

      before_filter :load_organization
      before_filter :admins_only
      before_filter :load_user, only: [:show, :update, :destroy]
      before_filter :ensure_edit_permissions, only: [:show, :update, :destroy]

      def index
        presentations = @organization.users.each do |user|
          Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_eumapi_poro
        end

        render_jsonp presentations, 200
      end

      def show
        presentation = Carto::Api::UserPresenter.new(@user, current_viewer: current_viewer)
                                                .to_eumapi_poro

        render_jsonp presentation, 200
      end

      def create
        account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_API)
                                                     .with_organization(@organization)

        account_creator.with_username(create_params[:username]) if create_params[:username].present?
        account_creator.with_email(create_params[:email]) if create_params[:email].present?
        account_creator.with_password(create_params[:password]) if create_params[:password].present?
        account_creator.with_quota_in_bytes(create_params[:quota_in_bytes]) if create_params[:quota_in_bytes].present?

        param_viewer = create_params[:viewer]
        account_creator.with_viewer(param_viewer) if param_viewer

        param_org_admin = create_params[:org_admin]
        account_creator.with_org_admin(param_org_admin) if param_org_admin

        if create_params[:soft_geocoding_limit].present?
          account_creator.with_soft_geocoding_limit(create_params[:soft_geocoding_limit])
        end

        if create_params[:soft_here_isolines_limit].present?
          account_creator.with_soft_here_isolines_limit(create_params[:soft_here_isolines_limit])
        end

        if create_params[:soft_obs_snapshot_limit].present?
          account_creator.with_soft_obs_snapshot_limit(create_params[:soft_obs_snapshot_limit])
        end

        if create_params[:soft_obs_general_limit].present?
          account_creator.with_soft_obs_general_limit(create_params[:soft_obs_general_limit])
        end

        if create_params[:soft_twitter_datasource_limit].present?
          account_creator.with_soft_twitter_datasource_limit(create_params[:soft_twitter_datasource_limit])
        end

        if create_params[:soft_mapzen_routing_limit].present?
          account_creator.with_soft_mapzen_routing_limit(create_params[:soft_mapzen_routing_limit])
        end

        unless account_creator.valid_creation?(current_viewer)
          render_jsonp(account_creator.validation_errors.full_messages, 410)
          return
        end

        account_creator.enqueue_creation(self)

        presentation = Carto::Api::UserPresenter.new(account_creator.user,
                                                     current_viewer: current_viewer)
                                                .to_eumapi_poro

        render_jsonp presentation, 200
      rescue => e
        CartoDB.notify_exception(e, user: account_creator.user.inspect)

        render_jsonp('An error has ocurred. Please contact support', 500)
      end

      def update
        render_jsonp('No update params provided', 410) && return if update_params.empty?

        params_to_update = update_params

        # ::User validation requires confirmation
        password = params_to_update[:password]
        params_to_update[:password_confirmation] = password

        # NOTE: Verify soft limits BEFORE updating the user
        model_validation_ok = soft_limits_validation(@user, params_to_update)
        model_validation_ok &&= @user.valid_password?(:password, password, password) if password.present?
        @user.set_fields(params_to_update, params_to_update.keys)
        model_validation_ok &&= @user.valid_update?(current_user)

        unless model_validation_ok
          render_jsonp(@user.errors.full_messages, 410)
          return
        end

        @user.update_in_central
        @user.save

        presentation = Carto::Api::UserPresenter.new(@user, current_viewer: current_viewer)
                                                .to_eumapi_poro

        render_jsonp presentation, 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB.notify_exception(e)

        render_jsonp 'Central comunication failure', 500
      end

      def destroy
        if @organization.owner_id == @user.id
          render_jsonp("Can't delete org owner", 401) and return
        end

        force_destroy = params[:force].present?

        if !force_destroy && @user.has_shared_entities?
          error_message = "Can't delete @user. 'Has shared entities"
          render_jsonp(error_message, 410 ) and return
        end

        @user.set_force_destroy if force_destroy
        @user.destroy
        @user.delete_in_central

        render_jsonp 'User deleted', 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB::Logger.error(exception: e, message: 'Central error deleting user from EUMAPI', user: @user)
        render_jsonp "User couldn't be deleted", 500
      rescue => e
        render_jsonp "User couldn't be deleted: #{e.message}", 500
      end

      private

      COMMON_MUTABLE_ATTRIBUTES = [
        :email,
        :password,
        :quota_in_bytes,
        :soft_geocoding_limit,
        :soft_here_isolines_limit,
        :soft_obs_general_limit,
        :soft_obs_snapshot_limit,
        :soft_twitter_datasource_limit,
        :soft_mapzen_routing_limit,
        :viewer,
        :org_admin
      ].freeze

      # TODO: Use native strong params when in Rails 4+
      def create_params
        @create_params ||=
          permit(COMMON_MUTABLE_ATTRIBUTES + [:username])
      end

      # TODO: Use native strong params when in Rails 4+
      def update_params
        @update_params ||= permit(COMMON_MUTABLE_ATTRIBUTES)
      end

      def ensure_edit_permissions
        unless @user.editable_by?(current_viewer)
          render_jsonp({ errors: ['You do not have permissions to edit that user'] }, 401)
        end
      end
    end
  end
end
