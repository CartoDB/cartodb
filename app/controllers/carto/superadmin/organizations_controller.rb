# encoding: UTF-8

require_dependency 'carto/superadmin/metrics_controller_helper'

module Carto
  module Superadmin
    class OrganizationsController < ::Superadmin::SuperadminController
      include MetricsControllerHelper

      respond_to :json

      ssl_required :usage
      before_filter :load_organization

      rescue_from ArgumentError, with: :render_format_error

      def usage
        usage = get_usage(nil, @organization, @organization.owner.last_billing_cycle)

        respond_with(usage)
      end

      private

      def render_format_error(exception)
        render(json: { error: exception.message }, status: 422)
      end

      def load_organization
        @organization = Carto::Organization.where(id: params[:id]).first
        render json: { error: 'Organization not found' }, status: 404 unless @organization
      end
    end
  end
end
