module Carto
  module Api
    class InvitationsController < ::Api::ApplicationController

      ssl_required :create

      before_filter :load_organization

      def create
        @organization.update_attribute(:auth_username_password_enabled, true) if params[:enable_organization_signup] === true

        invitation = Carto::Invitation.create_new(
          Carto::User.find(current_user.id),
          params[:users_emails],
          params[:welcome_text],
          params[:viewer]
        )
        if invitation.valid?
          render_jsonp(Carto::Api::InvitationPresenter.new(invitation).to_poro)
        else
          render json: { errors: invitation.errors }, status: 400
        end
      rescue StandardError => e
        CartoDB.notify_exception(e, params: params , invitation: (invitation ? invitation : 'not created'))
        render json: { errors: e.message }, status: 500
      end

      private

      def load_organization
        @organization = Carto::Organization.where(id: params[:organization_id]).first
        render_404 && return unless @organization
        unless @organization.admin?(current_user)
          render_jsonp({ errors: { organization: 'not admin' } }, 401) && return
        end
      end

    end
  end
end
