module Carto
  module Api
    class OrganizationNotificationsController < ::Api::ApplicationController
      extend Carto::DefaultRescueFroms

      ssl_required :create, :destroy

      before_filter :owners_only, :load_organization
      before_filter :load_notification, only: [:destroy]

      setup_default_rescues

      respond_to :json

      def create
        notification_parameters = params.require(:notification).permit(:icon, :body, :recipients)
        notification = @organization.notifications.create!(notification_parameters)
        render_jsonp(NotificationPresenter.new(notification).to_hash, :created)
      end

      def destroy
        @notification.destroy
        head :no_content
      end

      private

      def load_organization
        @organization = Carto::Organization.find(current_user.organization_id)
        unless [@organization.name, @organization.id].include?(params[:organization_id])
          raise Carto::LoadError.new('Cannot find organization')
        end
      end

      def owners_only
        raise Carto::UnauthorizedError.new('Only organization owners') unless current_user.organization_owner?
      end

      def load_notification
        @notification = @organization.notifications.find(params[:id])
      end
    end
  end
end
