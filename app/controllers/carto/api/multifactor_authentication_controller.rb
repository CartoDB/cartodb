# encoding: utf-8

module Carto
  module Api
    class MultifactorAuthenticationController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include OrganizationUsersHelper

      ssl_required

      before_action :check_ff
      before_action :load_organization
      before_action :admins_only
      before_action :load_user
      before_action :ensure_edit_permissions

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error
      rescue_from CartoDB::CentralCommunicationFailure, with: :rescue_from_central_error
      rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_validation_error

      def create
        Carto::UserMultifactorAuth.create!(base_params.merge(user_id: @user.id))
        render_jsonp({ success: true }, 201)
      end

      def destroy
        @user.user_multifactor_auths.where(base_params).each(&:destroy!)
        render_jsonp({ success: true }, 204)
      end

      private

      def check_ff
        raise Carto::UnauthorizedError.new unless current_viewer.has_feature_flag?('mfa')
      end

      def base_params
        params.permit([:type])
      end

      def ensure_edit_permissions
        unless @user.editable_by?(current_viewer)
          render_jsonp({ errors: ['You do not have permissions to edit that user'] }, 401)
        end
      end

      def rescue_from_central_error
        CartoDB::Logger.error(exception: e,
                              message: 'Central error deleting Multifactor authentication from EUMAPI',
                              user: @user)
        render_jsonp "Multifactor authentication couldn't be deleted", 500
      end
    end
  end
end
