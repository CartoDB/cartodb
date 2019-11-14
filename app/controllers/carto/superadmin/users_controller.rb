require_dependency 'carto/superadmin/metrics_controller_helper'

module Carto
  module Superadmin
    class UsersController < ::Superadmin::SuperadminController
      include MetricsControllerHelper

      respond_to :json

      ssl_required :usage
      before_filter :load_user

      rescue_from ArgumentError, with: :render_format_error

      def usage
        usage = get_usage(@user, nil, @user.last_billing_cycle)

        respond_with(usage)
      end

      private

      def render_format_error(exception)
        render(json: { error: exception.message }, status: 422)
      end

      def load_user
        @user = Carto::User.where(id: params[:id]).first
        render json: { error: 'User not found' }, status: 404 unless @user
      end
    end
  end
end
