# coding: utf-8

require_relative '../../../models/visualization/collection'

class Api::Json::MapsController < Api::ApplicationController
  include Carto::UUIDHelper

  ssl_required :update

  before_filter :load_map

  def update
    @stats_aggregator.timing('maps.update') do

      begin
        updated = @stats_aggregator.timing('save') do
          @map.update(params.slice(:provider, :bounding_box_sw, :bounding_box_ne, :center, :zoom, :table_id, \
                                           :view_bounds_sw, :view_bounds_ne, :legends, :scrollwheel))
        end

        unless updated == false
          render_jsonp(@map.public_values)
        else
          CartoDB::Logger.info "Error on maps#update", @map.errors.full_messages
          render_jsonp({ :description => @map.errors.full_messages,
            :stack => @map.errors.full_messages}, 400)
        end
      rescue CartoDB::NamedMapsWrapper::HTTPResponseError => exception
        CartoDB::Logger.info("Communication error with tiler API. HTTP Code: #{exception.message}",
          exception.template_data)
        render_jsonp({ errors: {
            named_maps_api: "Communication error with tiler API. HTTP Code: #{exception.message}"
          } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapDataError => exception
        render_jsonp({ errors: { named_map: exception } }, 400)
      rescue CartoDB::NamedMapsWrapper::NamedMapsDataError => exception
        render_jsonp({ errors: { named_maps: exception } }, 400)
      end

    end
  end

  protected

  def load_map
    raise RecordNotFound unless is_uuid?(params[:id])

    # User must be owner or have permissions for the map's visualization
    vis = CartoDB::Visualization::Collection.new.fetch(
        user_id:        current_user.id,
        map_id:         params[:id],
        exclude_raster: true
    ).first
    raise RecordNotFound if vis.nil?

    @map = ::Map.filter(id: params[:id]).first
    raise RecordNotFound if @map.nil?
  end
end
