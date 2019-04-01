require_dependency 'carto/controller_helper'

class Admin::SearchPreviewController < Admin::AdminController
  include Carto::ControllerHelper

  ssl_required

  before_filter :load_parameters

  rescue_from StandardError, with: :rescue_from_standard_error
  rescue_from Carto::ParamCombinationInvalidError, with: :rescue_from_carto_error

  DEFAULT_LIMIT = 4
  VALID_TYPES = Carto::Visualization::VALID_TYPES + ["tag"]

  def index
    searcher_params = { user: current_viewer, context: self, pattern: @pattern, types: @types }
    searcher = Carto::DashboardPreviewSearcher.new(searcher_params)
    result = searcher.search(limit: @limit)
    total_count = searcher.total_count

    render json: { result: result, total_count: total_count }
  end

  private

  def load_parameters
    @limit = (params[:limit] || DEFAULT_LIMIT).to_i
    @pattern = params[:q]

    @types = params.fetch(:types, "").split(',')
    if (@types - VALID_TYPES).present?
      raise Carto::ParamCombinationInvalidError.new(:types, VALID_TYPES)
    end
  end

end
