# encoding: utf-8

class Carto::Api::AssetsController < ::Api::ApplicationController
  ssl_required :index

  def index
    assets = current_viewer.assets.each do |asset|
      Carto::Api::AssetPresenter.new(asset).to_hash
    end

    render json: { total_entries: assets.size, assets: assets }
  end
end
