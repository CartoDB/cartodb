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

      after_filter :render_mapcap

      rescue_from StandardError, with: :rescue_from_standard_error
      rescue_from Carto::LoadError,
                  Carto::UnauthorizedError,
                  Carto::UnprocesableEntityError,
                  Carto::UnauthorizedError, with: :rescue_from_carto_error

      def create
        @mapcap = Carto::Mapcap.create!(visualization_id: @visualization.id)
      end

      def destroy
        @analysis.destroy
      end

      def show; end

      private

      def load_visualization
        visualization_id = params[:visualization_id]

        @visualization = Carto::Visualization.find(visualization_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Visualization not found: #{visualization_id}")
      end

      def owners_only
        raise Carto::UnauthorizedError.new unless @visualization.owner?(current_user)
      end

      def load_mapcap
        mapcap_id = params[:id]

        @mapcap = Carto::Mapcap.find(mapcap_id)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("Mapcap not found: #{mapcap_id}")
      end

      def render_mapcap
        render_jsonp(Carto::MapcapPresenter.new(@mapcap).to_poro, 200)
      end
    end
  end
end
