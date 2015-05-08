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

      def index
        synchronizations = Carto::Synchronization.where(user_id: current_user.id)
        representation = synchronizations.map(&:to_hash)
        response  = {
          synchronizations: representation,
          total_entries: synchronizations.count
        }
        render_jsonp(response)
      end

    end
  end
end


