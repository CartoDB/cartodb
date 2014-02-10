# coding: utf-8

class Api::Json::MapsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :delete

  before_filter :load_map, :except => :create

  def show
    render_jsonp(@map.public_values)
  end

  def create
    @map = Map.new(params.slice(:provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :table_id, :view_bounds_sw, :view_bounds_ne))
    @map.user_id = current_user.id

    if @map.save
      render_jsonp(@map.public_values)
    else
      CartoDB::Logger.info "Error on maps#create", @map.errors.full_messages
      render_jsonp( { :description => @map.errors.full_messages,
                      :stack => @map.errors.full_messages
                    }, 400)
    end
  end

  def update
    unless @map.update(params.slice(:provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :table_id, :view_bounds_sw, :view_bounds_ne)) == false
      render_jsonp(@map.public_values)
    else
      CartoDB::Logger.info "Error on maps#update", @map.errors.full_messages
      render_jsonp({ :description => @map.errors.full_messages, 
        :stack => @map.errors.full_messages}, 400)
    end
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end

  def destroy
    @map.destroy
    head :no_content
  rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
    render_jsonp({ errors: { named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}" } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
    render_jsonp({ errors: { named_map: exception } }, 400)
  rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
    render_jsonp({ errors: { named_maps: exception } }, 400)
  end

  protected

  def load_map
    @map = Map.filter(user_id: current_user.id, id: params[:id]).first
    raise RecordNotFound if @map.nil?
  end
end
