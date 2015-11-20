require_relative 'visualization_presenter'
require_relative 'vizjson_presenter'
require_relative '../../../models/visualization/stats'
require_relative 'paged_searcher'
require_dependency 'carto/uuidhelper'
require_dependency 'static_maps_url_helper'
require_relative '../controller_helper'

module Carto
  module Api
    class BiVisualizationsController < ::Api::ApplicationController
      include Carto::UUIDHelper
      include Carto::ControllerHelper

      ssl_allowed :vizjson

      before_filter :load_parameters
      before_filter :load_bi_visualization

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

      def vizjson
        render_jsonp(@bi_visualization.viz_json_json)
      end

      private

      def load_parameters
        @bi_visualization_id = uuid_parameter(:id)
      end

      def load_bi_visualization
        @bi_visualization = Carto::BiVisualization.find(@bi_visualization_id)
        raise Carto::UnauthorizedError.new unless @bi_visualization.accessible_by?(current_user)
      rescue ActiveRecord::RecordNotFound
        raise Carto::LoadError.new("BiVisualization not found: #{@bi_visualization_id}")
      end
    end
  end
end
