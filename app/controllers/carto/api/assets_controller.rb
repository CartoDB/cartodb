# encoding: utf-8

class Carto::Api::AssetsController < ::Api::ApplicationController
  ssl_required :index

  def index
    assets = AssetsPresenter.collection_to_hash(current_viewer.assets)

    render json: { total_entries: assets.size, assets: assets_presentation }
  end
end
