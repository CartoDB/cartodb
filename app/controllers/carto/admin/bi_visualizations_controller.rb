# encoding: utf-8

class Carto::Admin::BiVisualizationsController < ::Admin::AdminController
  include Carto::ControllerHelper
  include Carto::BiVisualizationsControllerHelper

  ssl_allowed :embed_map

  before_filter :load_parameters
  before_filter :load_bi_visualization

  rescue_from Carto::LoadError, with: :rescue_from_carto_error
  rescue_from Carto::UUIDParameterFormatError, with: :rescue_from_carto_error
  rescue_from Carto::UnauthorizedError, with: :rescue_from_carto_error

end
