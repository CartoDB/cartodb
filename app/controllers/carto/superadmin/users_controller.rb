# encoding: UTF-8

require_dependency 'carto/superadmin/metrics_controller_helper'

module Carto
  module Superadmin
    class UsersController < ::Superadmin::SuperadminController
      include MetricsControllerHelper

      respond_to :json

      ssl_required :usage
      before_filter :load_user

      rescue_from ArgumentError, with: :render_date_format_error

      def usage
        services = params[:services] || []
        return render(json: { error: 'services must be an array' }, status: 422) unless services.is_a?(Array)
        services = services.map(&:to_sym)
        date_to = params[:to] ? Date.parse(params[:to]) : Date.today
        date_from = params[:from] ? Date.parse(params[:from]) : @user.last_billing_cycle
        totals = params[:totals].present? && params[:totals] == 'true'
        usage = get_usage(@user, nil, date_from, date_to, services, totals)

        respond_with(usage)
      end

      private

      def render_date_format_error
        render(json: { error: 'Invalid date format' }, status: 422)
      end

      def load_user
        @user = Carto::User.where(id: params[:id]).first
        render json: { error: 'User not found' }, status: 404 unless @user
      end
    end
  end
end
