# coding: UTF-8
require_relative '../../../models/layer/presenter'
require_relative '../../../models/visualization/member'

class Api::Json::LayersController < Api::ApplicationController

  ssl_required :index, :show, :create, :update, :destroy
  before_filter :load_parent
  before_filter :validate_read_write_permission, only: [:create, :update, :destroy]

  def index
    @layers = @parent.layers
    render_jsonp total_entries: @layers.size, layers: @layers.map(&:public_values)
  end

  def show
    @layer = @parent.layers_dataset.where(layer_id: params[:id]).first
    render_jsonp @layer.to_json
  end

  def create
    @layer = Layer.new(params.slice(:kind, :options, :infowindow, :tooltip, :order))
    if @parent.is_a?(Map) && !@parent.admits_layer?(@layer)
      return(render  status: 400, text: "Can't add more layers of this type")
    end

    if @layer.save
      @parent.add_layer(@layer)
      @layer.register_table_dependencies if @parent.is_a?(Map)
      @parent.process_privacy_in(@layer) if @parent.is_a?(Map)
        
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
    @layer.raise_on_save_failure = true
    @layer.update(params.slice(:options, :kind, :infowindow, :tooltip, :order))

    render_jsonp(@layer.public_values)
  rescue Sequel::ValidationFailed, RuntimeError => e
    render_jsonp({ description: e.message }, 400)
  end

  def destroy
    @parent.layers_dataset.where(layer_id: params[:id]).destroy
    head :no_content
  end

  protected

  def load_parent
    @parent = user_from(params) || map_from(params)
    raise RecordNotFound if @parent.nil?
  end #load_parent

  def user_from(params={})
    current_user if params[:user_id]
  end #user_from

  def map_from(params={})
    return unless params[:map_id]

    # User must be owner or have permissions for the map's visualization
    vis = CartoDB::Visualization::Collection.new.fetch(
        user_id: current_user.id,
        map_id: params[:map_id]
    )
    raise RecordNotFound if vis.nil?

    Map.filter(id: params[:map_id]).first
  end #map_from

  def validate_read_write_permission
    layer = Layer[params[:id]]
    layer.maps.each { |map|
      map.visualizations.each { |vis|
        return head(403) unless vis.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
      }
    }
    true
  rescue => e
    render_jsonp({ description: e.message }, 400)
  end
end
