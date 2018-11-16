# encoding: utf-8

module Carto
  module Api
    class MultifactorAuthenticationController < ::Api::ApplicationController
      include Carto::ControllerHelper
      extend  Carto::DefaultRescueFroms
      include OrganizationUsersHelper

      ssl_required

      before_action :check_ff
      before_action :load_organization
      before_action :admins_only
      before_action :load_user
      before_action :create_service
      before_action :ensure_edit_permissions

      setup_default_rescues

      def create
        if @service.exists?(type: base_params[:type])
          raise Carto::UnprocesableEntityError.new('Multi-factor authentication already exists')
        end

        @service.update(enabled: true, type: base_params[:type])
        render_jsonp({ success: true }, 201)
      end

      def destroy
        unless @service.exists?(type: base_params[:type])
          raise Carto::UnprocesableEntityError.new('Multi-factor authentication does not exist')
        end

        @service.update(enabled: false, type: base_params[:type])
        render_jsonp({ success: true }, 204)
      end

      private

      def check_ff
        raise Carto::UnauthorizedError.new unless current_viewer.has_feature_flag?('mfa')
      end

      def base_params
        @base_params ||= params.permit([:type])
      end

      def create_service
        @service = Carto::UserMultifactorAuthUpdateService.new(user_id: @user.id)
      end
    end
  end
end
