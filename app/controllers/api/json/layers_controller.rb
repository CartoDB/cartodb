# coding: UTF-8
require_relative '../../../models/layer/presenter'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/collection'

class Api::Json::LayersController < Api::ApplicationController

  ssl_required :index, :show, :create, :update, :destroy
  before_filter :load_parent
  before_filter :validate_read_write_permission, only: [:update, :destroy]

  def index
    @layers = @parent.layers
    layers = @layers.map { |layer|
      CartoDB::Layer::Presenter.new(layer, {:viewer_user => current_user}).to_poro
    }
    render_jsonp layers: layers, total_entries: @layers.size
  end

  def show
    @layer = @parent.layers_dataset.where(layer_id: params[:id]).first
    render_jsonp @layer.to_json
  end

  def create
    @layer = ::Layer.new(params.slice(:kind, :options, :infowindow, :tooltip, :order))
    if @parent.is_a?(::Map)
      unless @parent.admits_layer?(@layer)
        return(render status: 400, text: "Can't add more layers of this type")
      end
      unless @parent.can_add_layer(current_user)
        return(render_jsonp({:description => 'You cannot add a layer in this visualization'}, 403))
      end
      if ::Layer::DATA_LAYER_KINDS.include?(@layer.kind)
        table_visualization = Helpers::TableLocator.new.get_by_id_or_name(
            @layer.options['table_name'], 
            current_user
          ).table_visualization
        unless table_visualization.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
          return(render_jsonp({:description => 'You do not have permission in the layer you are trying to add'}, 400))
        end
      end
    end

    if @layer.save
      @parent.add_layer(@layer)
      @layer.register_table_dependencies if @parent.is_a?(::Map)
      @parent.process_privacy_in(@layer) if @parent.is_a?(::Map)

      render_jsonp CartoDB::Layer::Presenter.new(@layer, {:viewer_user => current_user}).to_poro
    else
      CartoDB::Logger.info "Error on layers#create", @layer.errors.full_messages
      render_jsonp( { :description => @layer.errors.full_messages,
                      :stack => @layer.errors.full_messages
                    }, 400)
    end
  end

  def update
    ids = ids_from_url_or_parameters
    layers = []

    ids.each { |id|
      layer = ::Layer[id]
      layer.raise_on_save_failure = true
      # don't allow to override table_name and user_name
      # https://cartodb.atlassian.net/browse/CDB-3350
      layer_params = ids.length == 1 ? params : params[:layers].select { |p| p['id'] == id }.first
      layer_params[:options]['table_name'] = layer.options['table_name'] if layer_params.include?(:options) && layer_params[:options].include?('table_name')
      layer_params[:options]['user_name'] = layer.options['user_name'] if layer_params.include?(:options) && layer_params[:options].include?('user_name')
      layer.update(layer_params.slice(:options, :kind, :infowindow, :tooltip, :order))
      layers << layer
    }

    if layers.count > 1
      layers_json = layers.map { |l| CartoDB::Layer::Presenter.new(l, {:viewer_user => current_user}).to_poro }
      render_jsonp({ layers: layers_json })
    else
      render_jsonp CartoDB::Layer::Presenter.new(layers[0], {:viewer_user => current_user}).to_poro
    end
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
  end

  def user_from(params={})
    current_user if params[:user_id]
  end #user_from

  def map_from(params={})
    return unless params[:map_id]

    # User must be owner or have permissions for the map's visualization
    vis_collection = CartoDB::Visualization::Collection.new.fetch(
        user_id: current_user.id,
        map_id: params[:map_id]
    )
    raise RecordNotFound if vis_collection.count == 0

    ::Map.filter(id: params[:map_id]).first
  end #map_from

  def ids_from_url_or_parameters
    params[:id].present? ? [ params[:id] ] : params[:layers].map { |l| l['id'] }
  end

  def validate_read_write_permission
    ids = ids_from_url_or_parameters
    ids.each { |id|
      layer = ::Layer[id]
      layer.maps.each { |map|
        map.visualizations.each { |vis|
          return head(403) unless vis.is_owner?(current_user) || vis.has_permission?(current_user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
        }
      }
    }
    true
  rescue => e
    render_jsonp({ description: e.message }, 400)
  end
end
