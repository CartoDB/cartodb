# enconding utf-8

module Carto
  module Api
    class MetricsController < ::Api::ApplicationController
      ssl_required only: :create

      before_filter :load_event_class

      rescue_from Carto::Tracking::Exceptions::UnprocessableEntity,
                  with: :report_unprocessable_entity

      def create
        @event.new(params[:payload]).report!
      end

      private

        def load_event_class
          event_name = params[:name]

          @event = event_name.constantize
        rescue NameError => exception
          raise exception unless exception.message.include?(event_name)

          byebug
        end

        def report_unprocessable_entity(exception)
          render json: { missing_properties: exception.missing_properties },
                 status: :unprocessable_entity
        end
    end
  end
end
