# coding: UTF-8

class Api::Json::LayersController < Api::ApplicationController
  ssl_required :show

  before_filter :load_map

  def index
    @layers = @map.layers
    render_jsonp({ :total_entries => @layers.size,
                   :layers => @layers.map(&:public_values)
                })
  end

  def show
    @layer = Layer[params[:id]]

    render_jsonp(@layer.public_values)
  end

  def create
    @layer = Layer.new(params.slice(:kind, :options, :infowindow))

    if @layer.save
      @layer.add_map(@map.id)
      render_jsonp(@layer.public_values)
    else
      CartoDB::Logger.info "Error on layers#create", @layer.errors.full_messages
      render_jsonp( { :description => @layer.errors.full_messages,
                      :stack => @layer.errors.full_messages
                    }, 400)
    end
  end

  def update
    @layer = Layer[params[:id]]

    if @layer.update(params.slice(:options, :kind, :infowindow))
      render_jsonp(@layer.public_values)
    else
      CartoDB::Logger.info "Error on layers#update", @layer.errors.full_messages
      render_jsonp({ :description => @layer.errors.full_messages, 
        :stack => @layer.errors.full_messages}, 400)
    end
  end

  def destroy
    Layer[params[:id]].destroy
    head :ok
  end


  protected
  
  def load_map
    @map = Map.filter(:user_id => current_user.id, :id => params[:map_id]).first
    raise RecordNotFound if @map.nil?
  end
 
end
