class Admin::TilesetsViewerController < ApplicationController
  protect_from_forgery except: :index

  def index
    render(file: "public/static/tilesets_viewer/index.html", layout: false)
  end
end
