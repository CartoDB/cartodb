# encoding: UTF-8

require_dependency 'carto/superadmin/metrics_controller_helper'

module Carto
  module Superadmin
    class OrganizationsController < ::Superadmin::SuperadminController
      include MetricsControllerHelper

      respond_to :json

      ssl_required :usage
      before_filter :load_organization

      rescue_from ArgumentError, with: :render_date_format_error

      def usage
        services = params[:services] || []
        return render(json: { error: 'services must be an array' }, status: 422) unless services.is_a?(Array)
        services = services.map(&:to_sym)
        date_to = params[:to] ? Date.parse(params[:to]) : Date.today
        date_from = params[:from] ? Date.parse(params[:from]) : @organization.owner.last_billing_cycle
        totals = params[:totals].present? && params[:totals] == 'true'

        usage = get_usage(nil, @organization, date_from, date_to, services, totals)

        respond_with(usage)
      end

      private

      def render_date_format_error
        render(json: { error: 'Invalid date format' }, status: 422)
      end

      def load_organization
        @organization = Carto::Organization.where(id: params[:id]).first
        render json: { error: 'Organization not found' }, status: 404 unless @organization
      end
    end
  end
end
