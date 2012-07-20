# coding: UTF-8

class Api::Json::LayersController < Api::ApplicationController
  ssl_required :show

  before_filter :load_map

  def index
    @layers = @map.layers
    respond_to do |format|
      format.json do
        render_jsonp({ :total_entries => @layers.size,
                       :layers => @layers.map { |layer|
                            { :id => layer.id }
                        }
                    })
      end
    end
  end

  def show
    @layer = Layer[:id]
    respond_to do |format|
      format.json do
        render_jsonp({ :id => @layer.id
                       })
      end
    end    
  end

  protected
  
  def load_map
    @map = Map.filter(:user_id => current_user.id, :id => params[:map_id]).first
    raise RecordNotFound if @map.nil?
  end
 
end
