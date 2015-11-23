require_relative 'visualization_presenter'
require_relative 'vizjson_presenter'
require_relative '../../../models/visualization/stats'
require_relative 'paged_searcher'
require_dependency 'static_maps_url_helper'
require_relative '../controller_helper'

module Carto
  module Api
    class BiVisualizationsController < ::Api::ApplicationController
      include Carto::ControllerHelper
      include Carto::BiVisualizationsControllerHelper

      ssl_allowed :vizjson

      before_filter :load_parameters
      before_filter :load_bi_visualization

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

      def vizjson
        render_jsonp(@bi_visualization.viz_json_json)
      end

    end
  end
end
