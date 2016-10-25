# encoding: utf-8
require_relative '../builder/builder_users_module'

require_dependency 'carto/tracking/events'

module Carto
  module Api
    class MapcapsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::Builder::BuilderUsersModule

      ssl_required :show, :create, :destroy, :index

      before_filter :builder_users_only,
                    :load_visualization,
                    :owners_only
      before_filter :load_mapcap, only: [:show, :destroy]

      after_filter :ensure_only_one_mapcap,
                   :track_published_map, only: :create

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def index
        render_jsonp(@visualization.mapcaps.map { |mapcap| Carto::Api::MapcapPresenter.new(mapcap).to_poro })
      end

      def create
        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)

        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro, :created)
      end

      def show
        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro)
      end

      def destroy
        @mapcap.destroy

        render_jsonp({}, :no_content)
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
        raise Carto::UnauthorizedError.new unless @visualization.writable_by?(current_user)
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

      def track_published_map
        current_viewer_id = current_viewer.id
        Carto::Tracking::Events::PublishedMap.new(current_viewer_id,
                                                  user_id: current_viewer_id,
                                                  visualization_id: @visualization.id).report
      end
    end
  end
end
