# encoding utf-8

module Carto
  module Api
    class MetricsController < ::Api::ApplicationController
      include Carto::ControllerHelper

      ssl_required :create

      before_filter :load_event_class, only: :create

      rescue_from Carto::LoadError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def create
        @event_class.new(params[:properties]).report

        render json: Hash.new, status: :created
      end

      private

      def load_event_class
        event_name = params[:name]

        raise Carto::UnprocesableEntityError.new('name not provided') unless event_name

        modulized_name = "Carto::Tracking::Events::#{event_name.parameterize('_').camelize}"
        @event_class = modulized_name.constantize

      rescue NameError
        raise Carto::LoadError.new("Event not found: #{event_name}")
      end
    end
  end
end
