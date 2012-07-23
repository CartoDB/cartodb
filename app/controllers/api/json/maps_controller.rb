# coding: utf-8

class Api::Json::MapsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :delete

  before_filter :load_map, :except => :create

  def show
    respond_to do |format|
      format.json do
        render_jsonp(@map.values.to_json)
      end
    end
  end

  def create
    @map = Map.new(params.slice(:provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :table_id))
    @map.user_id = current_user.id

    if @map.save
      render_jsonp(@map.values.to_json)
    else
      CartoDB::Logger.info "Error on maps#create", @map.errors.full_messages
      render_jsonp( { :description => @map.errors.full_messages,
                      :stack => @map.errors.full_messages
                    }, 400)
    end
  end

  def update
    if @map.update(params.slice(:provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :table_id))
      render_jsonp(@map.values.to_json)
    else
      CartoDB::Logger.info "Error on maps#update", @map.errors.full_messages
      render_jsonp({ :description => @map.errors.full_messages, 
        :stack => @map.errors.full_messages}, 400)
    end
  end

  def destroy
    @map.destroy
    head :ok
  end

  protected

  def load_map
    @map = Map.filter(user_id: current_user.id, id: params[:id]).first
    raise RecordNotFound if @map.nil?
  end
end
