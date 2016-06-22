# encoding: utf-8
require_relative '../builder/builder_users_module'

module Carto
  module Api
    class MapcapsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::Builder::BuilderUsersModule

      ssl_required :show, :create, :destroy

      before_filter :builder_users_only,
                    :load_visualization,
                    :owners_only
      before_filter :load_mapcap, only: [:show, :destroy]

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      after_filter :invalidate_visualization_cache, only: [:create, :destroy]

      def index
        render_jsonp(@visualization.mapcaps.map { |mapcap| Carto::Api::MapcapPresenter.new(mapcap).to_poro }, 201)
      end

      def create
        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)

        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro, 201)
      end

      def show
        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro)
      end

      def destroy
        @mapcap.destroy

        render_jsonp(Carto::Api::MapcapPresenter.new(@mapcap).to_poro)
      end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.find(visualization_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}")
      end

      def owners_only
        raise Carto::UnauthorizedError.new unless @visualization.is_writable_by_user(current_user)
      end

      def load_mapcap
        mapcap_id = params[:id]

        @mapcap = Carto::Mapcap.find(mapcap_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Mapcap not found: #{mapcap_id}")
      end

      def invalidate_visualization_cache
        @visualization.invalidate_cache
      end
    end
  end
end
