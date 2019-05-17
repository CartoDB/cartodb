class Carto::Api::CartoframesVisualizationsController < ::Api::ApplicationController
  ssl_required :index, :create, :update, :destroy

  def index
    head 501
  end

  def create
    head 200
  end

  def update
    head 501
  end

  def delete
    head 501
  end

end
