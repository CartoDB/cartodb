# encoding: utf-8

require_relative './user_presenter'

module Carto
  module Api
    class OrganizationUsersController < ::Api::ApplicationController
      include OrganizationsHelper

      ssl_required

      before_filter :load_organization

      def create
        render_jsonp({}, 401) && return unless current_viewer_is_owner?

        user = ::User.new(create_params)
        user.organization_id = @organization.id
        current_viewer.copy_account_features(user)

        render_jsonp(user.errors.full_messages, 410) && return unless user.save

        user.create_in_central
        common_data_url = CartoDB::Visualization::CommonDataService.build_url(self)
        ::Resque.enqueue(::Resque::UserJobs::CommonData::LoadCommonData, user.id, common_data_url)

        user.notify_new_organization_user
        user.organization.notify_if_seat_limit_reached
        render_jsonp Carto::Api::UserPresenter.new(user).to_poro, 200
      rescue CartoDB::CentralCommunicationFailure => e
        Rollbar.report_exception(e)
        begin
          @user.destroy
        rescue => ee
          Rollbar.report_exception(ee)
        end

        render_jsonp 'Central comunication failure', 500
      end

      def destroy
        render_jsonp({}, 401) && return unless current_viewer_is_owner?

        user = ::User.where(delete_params.symbolize_keys).first

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
        permit(:email, :username, :password, :password_confirmation, :quota_in_bytes)
      end

      # TODO: Use native strong params when in Rails 4+
      def delete_params
        permit(:email, :username)
      end
    end
  end
end
