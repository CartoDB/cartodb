# coding: utf-8

class Api::Json::MapsController < Api::ApplicationController
  ssl_required :index, :create, :show, :update, :delete

  before_filter :load_map, :except => :create

  def show
    respond_to do |format|
      format.json do
        render_jsonp({ :id => @map.id,
                       :provider => @map.provider,
                       :bounding_box_sw => @map.bounding_box_sw,
                       :bounding_box_ne => @map.bounding_box_ne,
                       :center => @map.center,
                       :zoom => @map.zoom
                       })
      end
    end
  end

  def create
    @map = Map.new(params[:map])
    @map.user_id = current_user.id

    if @map.save
      render_jsonp( { :id => @map.id,
                       :provider => @map.provider,
                       :bounding_box_sw => @map.bounding_box_sw,
                       :bounding_box_ne => @map.bounding_box_ne,
                       :center => @map.center,
                       :zoom => @map.zoom
                       })
    else
      CartoDB::Logger.info "Error on maps#create", @map.errors.full_messages
      render_jsonp( { :description => @map.errors.full_messages,
                      :stack => @map.errors.full_messages
                    }, 400)
    end
  end

  protected

  def load_map
    @map = Map.filter(user_id: current_user.id, id: params[:id]).first
    raise RecordNotFound if @map.nil?
  end
end
