# encoding: utf-8

class Carto::Api::OrganizationAssetsController < ::Api::ApplicationController
  include Carto::ControllerHelper

  ssl_required :index

  rescue_from LoadError, with: :rescue_from_carto_error

  def index
  end

  private

  def load_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    raise LoadError.new
  end
end
