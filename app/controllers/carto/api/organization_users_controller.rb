# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationUsersController < ::Api::ApplicationController
      include OrganizationUsersHelper

      ssl_required :create, :update, :destroy

      before_filter :load_organization

      UPDATE_PARAMS_MAP = { new_username: :username }

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
        CartoDB.notify_exception(e, { new_user: account_creator.user.inspect })

        render_jsonp('An error has ocurred. Please contact support', 500)
      end

      def update
        render_jsonp({}, 401) && return unless current_viewer_is_owner?
        render_jsonp('No update params provided', 410) && return if update_params.empty? || delete_params.empty?

        user = ::User.where(delete_params).first
        render_jsonp("No user with #{delete_params}", 404) && return if user.nil?

        # Turn new_email: into email:, new_password: into password:, etc
        transformed_update_params = Hash[update_params.map { |k, v| [UPDATE_PARAMS_MAP[k] || k, v] }]

        # ::User validation requires confirmation
        if transformed_update_params[:password].present?
          transformed_update_params[:password_confirmation] = transformed_update_params[:password]
        end

        user.update(transformed_update_params)

        render_jsonp(user.errors.full_messages, 410) && return unless user.save

        user.update_in_central

        render_jsonp Carto::Api::UserPresenter.new(user, current_viewer: current_viewer).to_poro, 200
      rescue CartoDB::CentralCommunicationFailure => e
        Rollbar.report_exception(e)

        render_jsonp 'Central comunication failure', 500
      end

      def destroy
        render_jsonp({}, 401) && return unless current_viewer_is_owner?
        render_jsonp('No delete params provided', 410) && return if delete_params.empty?

        user = ::User.where(delete_params).first
        render_jsonp({}, 401) && return if @organization.owner.id == user.id

        render_jsonp("No user with #{delete_params}", 404) && return if user.nil?
        render_jsonp("Can't delete user. #{'Has shared entities' if user.has_shared_entities?}", 410) unless user.can_delete

        user.delete_in_central
        user.destroy

        render_jsonp 'User deleted', 200
      rescue CartoDB::CentralCommunicationFailure => e
        Rollbar.report_exception(e)
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
      def delete_params
        permit(:email, :username)
      end

      # TODO: Use native strong params when in Rails 4+
      def update_params
        permit(:new_email, :password, :quota_in_bytes, :soft_geocoding_limit)
      end
    end
  end
end
