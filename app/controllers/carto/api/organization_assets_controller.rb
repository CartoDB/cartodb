# encoding: utf-8

class Carto::Api::OrganizationAssetsController < ::Api::ApplicationController
  include Carto::ControllerHelper

  ssl_required :index

  rescue_from LoadError, with: :rescue_from_carto_error

  def index
    presentation = AssetPresenter.collection_to_hash(@organization.assets)

    render json: presentation
  end

  private

  def load_organization
    @organization = Organization.find(params[:organization_id])
  rescue ActiveRecord::RecordNotFound
    raise LoadError.new('Organization not found')
  end

  def load_asset
    @asset = Organization.find(params[:asset_id])
  rescue ActiveRecord::RecordNotFound
    raise LoadError.new('Asset not found')
  end
end
