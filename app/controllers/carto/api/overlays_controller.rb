# encoding: UTF-8

module Carto
  module Api
    class OverlaysController < ::Api::ApplicationController

      ssl_required :index, :show
      before_filter :check_owner_by_vis, only: [ :index ]
      before_filter :check_owner_by_id, only: [ :show ]

      def index
        collection = Carto::Overlay.where(visualization_id: params.fetch('visualization_id'))
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

      def check_owner_by_id
        head 401 and return if current_user.nil?

        member = CartoDB::Overlay::Member.new(id: params.fetch('id')).fetch
        head 401 and return if member.nil?

        vis = Carto::Visualization.where(id: member.visualization_id).first
        head 403 and return if vis.user_id != current_user.id
      end

      def check_owner_by_vis
        head 401 and return if current_user.nil?

        vis = Carto::Visualization.where(id: params.fetch('visualization_id')).first
        head 401 and return if vis.nil?

        head 403 and return if vis.user_id != current_user.id && !vis.has_permission?(
            current_user, 
            Carto::Permission::PERMISSION_READWRITE
          )
      end

    end
  end
end