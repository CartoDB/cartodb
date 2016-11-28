# encoding: utf-8

class Carto::Api::AssetsController < ::Api::ApplicationController
  ssl_required :index

  def index
    assets = current_viewer.assets

    render_jsonp({ 
        total_entries: assets.size, 
        assets: assets.map { |asset| 
            Carto::Api::AssetsPresenter.new(asset).public_values
          }
      })
  end
end
