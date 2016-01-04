# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationUsersController < ::Api::ApplicationController
      include OrganizationUsersHelper

      ssl_required :create, :update, :destroy, :show

      before_filter :load_organization

      def show
        render_jsonp({}, 401) && return unless current_viewer_is_owner?

        user = ::User.where(username: params[:u_username], organization: @organization).first
        render_jsonp("No user with username '#{params[:u_username]}'", 404) && return if user.nil?

        render_jsonp Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_poro, 200
      end

      def create
        render_jsonp({}, 401) && return unless current_viewer_is_owner?

        account_creator = CartoDB::UserAccountCreator.new.with_organization(@organization)

        account_creator.with_username(create_params[:username]) if create_params[:username].present?
        account_creator.with_email(create_params[:email]) if create_params[:email].present?
        account_creator.with_password(create_params[:password]) if create_params[:password].present?
        account_creator.with_quota_in_bytes(create_params[:quota_in_bytes]) if create_params[:quota_in_bytes].present?
        account_creator.with_soft_geocoding_limit(create_params[:soft_geocoding_limit]) if create_params[:soft_geocoding_limit].present?

        render_jsonp(account_creator.validation_errors.full_messages, 410) && return unless account_creator.valid?

        account_creator.enqueue_creation(self)

        render_jsonp Carto::Api::UserPresenter.new(account_creator.user, current_viewer: current_viewer).to_poro, 200
      rescue => e
        CartoDB.notify_exception(e, user: account_creator.user.inspect)

        render_jsonp('An error has ocurred. Please contact support', 500)
      end

      def update
        render_jsonp({}, 401) && return unless current_viewer_is_owner?
        render_jsonp('No update params provided', 410) && return if update_params.empty?

        user = ::User.where(username: params[:u_username]).first
        render_jsonp("No user with username '#{params[:u_username]}'", 404) && return if user.nil?

        # ::User validation requires confirmation
        if update_params[:password].present?
          update_params[:password_confirmation] = update_params[:password]
        end

        render_jsonp(user.errors.full_messages, 410) && return unless user.update_fields(update_params, update_params.keys())

        user.update_in_central

        render_jsonp Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_poro, 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB.notify_exception(e)

        render_jsonp 'Central comunication failure', 500
      end

      def destroy
        render_jsonp({}, 401) && return unless current_viewer_is_owner?
        render_jsonp('No delete params provided', 410) && return if params[:u_username].empty?

        user = ::User.where(username: params[:u_username]).first
        render_jsonp({}, 401) && return if @organization.owner.id == user.id

        render_jsonp("No user with username '#{params[:u_username]}'", 404) && return if user.nil?
        render_jsonp("Can't delete user. #{'Has shared entities' if user.has_shared_entities?}", 410) unless user.can_delete

        user.delete_in_central
        user.destroy

        render_jsonp 'User deleted', 200
      rescue CartoDB::CentralCommunicationFailure => e
        CartoDB.notify_exception(e)
        if e.user_message =~ /No user found with username/
          user.destroy
          render_jsonp 'User deleted', 200
        else
          render_jsonp "User couldn't be deleted", 500
        end
      end

      private

      # TODO: Use native strong params when in Rails 4+
      def create_params
        permit(:email, :username, :password, :quota_in_bytes, :soft_geocoding_limit)
      end

      # TODO: Use native strong params when in Rails 4+
      def update_params
        permit(:email, :password, :quota_in_bytes, :soft_geocoding_limit)
      end
    end
  end
end
