# encoding: utf-8
require_relative '../builder/builder_users_module'

module Carto
  module Api
    class MapcapsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::Builder::BuilderUsersModule

      ssl_required :show, :create, :destroy, :index

      before_filter :builder_users_only,
                    :load_visualization,
                    :owners_only,
                    :load_state_json
      before_filter :load_mapcap, only: [:show, :destroy]

      after_filter :ensure_only_one_mapcap, only: :create

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def index
        render_jsonp(@visualization.mapcaps.map { |mapcap| Carto::Api::MapcapPresenter.new(mapcap).to_poro }, 201)
      end

      def create
        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id, state_json: @state_json)

        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro, 201)
      end

      def show
        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro)
      end

      def destroy
        @mapcap.destroy

        render_jsonp({}, 204)
      end

      private

      def load_visualization
        visualization_id = uuid_parameter(:visualization_id)

        @visualization = Carto::Visualization.find(visualization_id)

        raise ActiveRecord::RecordNotFound if @visualization.canonical?
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}")
      end

      def owners_only
        raise Carto::UnauthorizedError.new unless @visualization.is_writable_by_user(current_user)
      end

      def load_state_json
        state_json = params[:state_json]

        @state_json = state_json.present? ? state_json : {}

        raise Carto::UnprocesableEntityError unless @state_json.is_a?(Hash)
      end

      MAX_MAPCAPS_PER_MAP = 1

      def ensure_only_one_mapcap
        previous_mapcaps = @visualization.mapcaps # already ordered from newer to older

        previous_mapcaps[MAX_MAPCAPS_PER_MAP..-1].each(&:destroy) if previous_mapcaps.count > MAX_MAPCAPS_PER_MAP
      end

      def load_mapcap
        mapcap_id = uuid_parameter(:id)

        @mapcap = Carto::Mapcap.find(mapcap_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Mapcap not found: #{mapcap_id}")
      end
    end
  end
end
