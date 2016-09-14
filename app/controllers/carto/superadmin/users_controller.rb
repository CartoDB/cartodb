# encoding: UTF-8

require_dependency 'carto/superadmin/metrics_controller_helper'

module Carto
  module Superadmin
    class UsersController < ::Superadmin::SuperadminController
      include MetricsControllerHelper

      respond_to :json

      ssl_required :usage
      before_filter :load_user

      def usage
        date_to = (params[:to] ? params[:to].to_date : Date.today)
        date_from = (params[:from] ? params[:from].to_date : Date.today)

        usage = get_usage(@user, nil, date_from, date_to)

        respond_with(usage)
      end

      private

      def load_user
        @user = Carto::User.where(id: params[:id]).first
        render json: { error: 'User not found' }, status: 404 unless @user
      end
    end
  end
end
