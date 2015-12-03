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
      include PagedSearcher

      ssl_required :index, :show, :vizjson

      before_filter :api_authorization_required
      before_filter :load_parameters, except: [:index]
      before_filter :load_bi_visualization, except: [:index]

      rescue_from Carto::LoadError, with: :rescue_from_carto_error
      rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error
      rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

      def index
        page, per_page, order = page_per_page_order_params

        bi_visualizations = Carto::BiVisualization.joins(:bi_dataset)
                                                  .where(bi_datasets: { user_id: current_user.id })
                                                  .offset((page - 1) * per_page)
                                                  .limit(per_page)
                                                  .order(order)
                                                  .map do |v|
          Carto::Api::BiVisualizationPresenter.new(v).to_poro
        end

        response = {
          visualizations: bi_visualizations,
          total_entries: bi_visualizations.count
        }

        if current_user
          # redundant but ncessary for now
          response.merge!(total_user_entries: bi_visualizations.count)
        end

        render_jsonp(response)
      end

      def show
        render_jsonp([Carto::Api::BiVisualizationPresenter.new(@bi_visualization).to_poro])
      end

      def vizjson
        render_jsonp(@bi_visualization.viz_json_json)
      end
    end
  end
end
