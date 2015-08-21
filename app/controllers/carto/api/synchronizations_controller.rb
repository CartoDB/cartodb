module Carto
  module Api
    class SynchronizationsController < ::Api::ApplicationController

      ssl_required :show, :syncing?

      before_filter :load_synchronization, only: [:show, :syncing?]

      def show
        render_jsonp(@synchronization)
      rescue => exception
        CartoDB.notify_exception(exception)
        head(404)
      end

      def syncing?
        render_jsonp( { state: @synchronization.state } )
      rescue => exception
        CartoDB.notify_exception(exception)
        head(404)
      end

      private

      def load_synchronization
        @synchronization = Carto::Synchronization::where(id: params[:id]).first
        head(404) and return unless @synchronization
        head(401) and return unless @synchronization.authorize?(current_user)
      end

    end
  end
end


