# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationUsersController < ::Api::ApplicationController
      include OrganizationUsersHelper

      ssl_required :create, :update, :destroy, :show

      before_filter :load_organization
      before_filter :owners_only
      before_filter :load_user, only: [:show, :update, :destroy]

      def show
        render_jsonp(Carto::Api::UserPresenter.new(@user, current_viewer: current_viewer).to_poro, 200)
      end

      def create
        account_creator = CartoDB::UserAccountCreator.new(Carto::UserCreation::CREATED_VIA_API).with_organization(@organization)

        account_creator.with_username(create_params[:username]) if create_params[:username].present?
        account_creator.with_email(create_params[:email]) if create_params[:email].present?
        account_creator.with_password(create_params[:password]) if create_params[:password].present?
        account_creator.with_quota_in_bytes(create_params[:quota_in_bytes]) if create_params[:quota_in_bytes].present?
        account_creator.with_soft_geocoding_limit(create_params[:soft_geocoding_limit]) if create_params[:soft_geocoding_limit].present?
        account_creator.with_soft_here_isolines_limit(create_params[:soft_here_isolines_limit]) if create_params[:soft_here_isolines_limit].present?
        account_creator.with_soft_twitter_datasource_limit(create_params[:soft_twitter_datasource_limit]) if create_params[:soft_twitter_datasource_limit].present?

        render_jsonp(account_creator.validation_errors.full_messages, 410) && return unless account_creator.valid?

        account_creator.enqueue_creation(self)

        render_jsonp Carto::Api::UserPresenter.new(account_creator.user, current_viewer: current_viewer).to_poro, 200
      rescue => e
        CartoDB.notify_exception(e, user: account_creator.user.inspect)

        render_jsonp('An error has ocurred. Please contact support', 500)
      end

      def update
        render_jsonp('No update params provided', 410) && return if update_params.empty?

        params_to_update = update_params

        # ::User validation requires confirmation
        params_to_update[:password_confirmation] = params_to_update[:password]

        if !(soft_limits_validation(@user, params_to_update) && @user.update_fields(params_to_update, params_to_update.keys))
          render_jsonp(@user.errors.full_messages, 410)
          return
        end

        @user.update_in_central

        render_jsonp Carto::Api::UserPresenter.new(@user, current_viewer: current_viewer).to_poro, 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB.notify_exception(e)

        render_jsonp 'Central comunication failure', 500
      end

      def destroy
        render_jsonp("Can't delete org owner", 401) && return if @organization.owner_id == @user.id

        unless @user.can_delete
          render_jsonp("Can't delete @user. #{'Has shared entities' if @user.has_shared_entities?}", 410)
        end

        @user.delete_in_central
        @user.destroy

        render_jsonp 'User deleted', 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB.notify_exception(e)
        if e.user_message =~ /No user found with username/
          @user.destroy
          render_jsonp 'User deleted', 200
        else
          render_jsonp "User couldn't be deleted", 500
        end
      end

      private

      # TODO: Use native strong params when in Rails 4+
      def create_params
        permit(:email, :username, :password, :quota_in_bytes, :soft_geocoding_limit, :soft_here_isolines_limit, :soft_twitter_datasource_limit)
      end

      # TODO: Use native strong params when in Rails 4+
      def update_params
        permit(:email, :password, :quota_in_bytes, :soft_geocoding_limit, :soft_here_isolines_limit, :soft_twitter_datasource_limit)
      end
    end
  end
end
