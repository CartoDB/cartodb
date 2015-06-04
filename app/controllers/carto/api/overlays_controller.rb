# encoding: UTF-8

require_dependency 'carto/uuidhelper'

module Carto
  module Api
    class OverlaysController < ::Api::ApplicationController
      include Carto::UUIDHelper

      ssl_required :index, :show
      before_filter :check_current_user_has_permissions_on_vis, only: [ :index ]
      before_filter :check_current_user_owns_vis, only: [ :show ]

      def index
        collection = Carto::Overlay.where(visualization_id: params.fetch('visualization_id')).map { |overlay|
          Carto::Api::OverlayPresenter.new(overlay).to_poro
        }
        render_jsonp(collection)
      rescue KeyError
        head :not_found
      end

      def show
        member = Carto::Overlay.where(id: params.fetch('id')).first
        render_jsonp(member.attributes)
      rescue KeyError
        head :not_found
      end

      protected

      def check_current_user_owns_vis
        head 401 and return if current_user.nil?
        head 401 and return unless is_uuid?(params.fetch('id'))

        overlay = Carto::Overlay.where(id: params.fetch('id')).first
        head 401 and return if overlay.nil?

        vis = Carto::Visualization.where(id: overlay.visualization_id).first
        head 403 and return if vis.user_id != current_user.id
      end

      def check_current_user_has_permissions_on_vis
        head 401 and return if current_user.nil?
        head 401 and return unless is_uuid?(params.fetch('visualization_id'))

        vis = Carto::Visualization.where(id: params.fetch('visualization_id')).first
        head 401 and return if vis.nil?

        head 403 and return if !vis.is_writable_by_user(current_user)
      end

    end
  end
end
