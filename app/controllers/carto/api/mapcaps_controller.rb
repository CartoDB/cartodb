require_relative '../builder/builder_users_module'

require_dependency 'carto/tracking/events'

module Carto
  module Api
    class MapcapsController < ::Api::ApplicationController
      include Carto::Builder::BuilderUsersModule

      ssl_required :show, :create, :destroy, :index

      before_filter :builder_users_only,
                    :load_visualization,
                    :owners_only
      before_filter :load_mapcap, only: [:show, :destroy]

      after_filter :track_published_map, only: :create

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError, with: :rescue_from_carto_error

      def index
        render_jsonp(@visualization.mapcaps.map { |mapcap| Carto::Api::MapcapPresenter.new(mapcap).to_poro })
      end

      def create
        mapcap = @visualization.create_mapcap!

        render_jsonp(Carto::Api::MapcapPresenter.new(mapcap).to_poro, :created)
      rescue ActiveRecord::RecordInvalid => exception
        message = exception.record.errors.full_messages.join(', ')
        raise Carto::UnprocesableEntityError.new(message)
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

      def load_mapcap
        mapcap_id = uuid_parameter(:id)

        @mapcap = Carto::Mapcap.find(mapcap_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Mapcap not found: #{mapcap_id}")
      end

      def track_published_map
        current_viewer_id = current_viewer&.id
        Carto::Tracking::Events::PublishedMap.new(current_viewer_id,
                                                  user_id: current_viewer_id,
                                                  visualization_id: @visualization.id).report
      end
    end
  end
end
