module Carto
  module Api
    class MetricsController < ::Api::ApplicationController
      ssl_required :create

      skip_before_filter :api_authorization_required

      before_filter :load_event, only: :create

      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def create
        @event.report!

        render json: Hash.new, status: :created
      end

      private

      def load_event
        event_name = params[:name]

        raise Carto::UnprocesableEntityError.new('name not provided') unless event_name

        modulized_name = "Carto::Tracking::Events::#{event_name.parameterize('_').camelize}"

        @event = Carto::Tracking::Events::SegmentEvent.build(params[:name], current_viewer.try(:id), params[:properties])
        @event ||= modulized_name.constantize.new(current_viewer.try(:id), params[:properties])
      rescue NameError
        raise Carto::LoadError.new("Event not found: #{event_name}")
      end
    end
  end
end
