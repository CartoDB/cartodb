module Carto
  module Api
    class SynchronizationsController < ::Api::ApplicationController

      ssl_required :show

      def show
        synchronization = Carto::Synchronization::find(params[:id])

        return(head 401) unless synchronization.authorize?(current_user)
        render_jsonp(synchronization)
      rescue => exception
        CartoDB.notify_exception(exception)
        head(404)
      end

    end
  end
end


